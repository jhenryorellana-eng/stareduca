import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIN_PAYOUT_CENTS = 2000 // $20 minimo

// POST /api/affiliate/payout - Solicitar pago
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('sb-access-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser(authToken)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sesion invalida' },
        { status: 401 }
      )
    }

    const studentId = user.user_metadata?.student_id

    // Obtener afiliado
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'No eres afiliado' },
        { status: 400 }
      )
    }

    if (!affiliate.is_active) {
      return NextResponse.json(
        { success: false, error: 'Tu cuenta de afiliado no esta activa' },
        { status: 400 }
      )
    }

    if (!affiliate.paypal_email) {
      return NextResponse.json(
        { success: false, error: 'Debes configurar tu email de PayPal primero' },
        { status: 400 }
      )
    }

    if (affiliate.pending_balance_cents < MIN_PAYOUT_CENTS) {
      return NextResponse.json(
        { success: false, error: `El monto minimo para solicitar pago es $${MIN_PAYOUT_CENTS / 100}` },
        { status: 400 }
      )
    }

    // Verificar que no haya un pago pendiente
    const { data: pendingPayout } = await supabase
      .from('affiliate_payouts')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .in('status', ['pending', 'processing'])
      .single()

    if (pendingPayout) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una solicitud de pago pendiente' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { payment_method } = body

    if (!payment_method || !['paypal', 'bank_transfer'].includes(payment_method)) {
      return NextResponse.json(
        { success: false, error: 'Metodo de pago invalido' },
        { status: 400 }
      )
    }

    // Crear solicitud de pago
    const { data: payout, error } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id: affiliate.id,
        amount_cents: affiliate.pending_balance_cents,
        currency: 'USD',
        payment_method,
        payment_details: {
          paypal_email: affiliate.paypal_email
        },
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating payout:', error)
      return NextResponse.json(
        { success: false, error: 'Error al crear solicitud' },
        { status: 500 }
      )
    }

    // Actualizar comisiones aprobadas a "paid"
    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payout_id: payout.id
      })
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'approved')

    // Mover balance de pendiente a pagado
    await supabase
      .from('affiliates')
      .update({
        pending_balance_cents: 0,
        paid_balance_cents: affiliate.paid_balance_cents + affiliate.pending_balance_cents,
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliate.id)

    // Crear notificacion
    await supabase.from('notifications').insert({
      student_id: studentId,
      type: 'affiliate',
      title: 'Solicitud de pago enviada',
      message: `Tu solicitud de pago por $${affiliate.pending_balance_cents / 100} ha sido recibida`,
      action_url: '/affiliate'
    })

    return NextResponse.json({
      success: true,
      payout: {
        ...payout,
        amount: payout.amount_cents / 100
      }
    })

  } catch (error) {
    console.error('Error in POST /api/affiliate/payout:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
