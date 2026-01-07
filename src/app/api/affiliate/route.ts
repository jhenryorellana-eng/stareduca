import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyActiveSubscription } from '@/lib/auth/subscriptionCheck'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/affiliate - Obtener datos del afiliado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticacion y suscripcion activa
    const student = await verifyActiveSubscription()

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Requiere suscripcion activa', requiresSubscription: true },
        { status: 403 }
      )
    }

    const studentId = student.id

    // Obtener datos del afiliado
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('student_id', studentId)
      .single()

    if (error && error.code !== 'PGRST116') { // No es "not found"
      console.error('Error fetching affiliate:', error)
      return NextResponse.json(
        { success: false, error: 'Error al cargar datos' },
        { status: 500 }
      )
    }

    if (!affiliate) {
      // No es afiliado aun
      return NextResponse.json({
        success: true,
        affiliate: null,
        isAffiliate: false
      })
    }

    // Obtener comisiones recientes
    const { data: recentCommissions } = await supabase
      .from('affiliate_commissions')
      .select(`
        id,
        subscription_amount_cents,
        commission_cents,
        commission_rate,
        status,
        created_at,
        referred_student:students!referred_student_id (
          id,
          full_name,
          student_code
        )
      `)
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Obtener pagos recientes
    const { data: recentPayouts } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Obtener estadisticas de clicks de los ultimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: clickStats } = await supabase
      .from('affiliate_link_clicks')
      .select('created_at')
      .eq('affiliate_id', affiliate.id)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Agrupar clicks por dia
    const clicksByDay: Record<string, number> = {}
    clickStats?.forEach(click => {
      const day = new Date(click.created_at).toISOString().split('T')[0]
      clicksByDay[day] = (clicksByDay[day] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      isAffiliate: true,
      affiliate: {
        ...affiliate,
        total_earnings: affiliate.total_earnings_cents / 100,
        pending_balance: affiliate.pending_balance_cents / 100,
        paid_balance: affiliate.paid_balance_cents / 100
      },
      recentCommissions: recentCommissions?.map(c => ({
        ...c,
        subscription_amount: c.subscription_amount_cents / 100,
        commission_amount: c.commission_cents / 100
      })) || [],
      recentPayouts: recentPayouts?.map(p => ({
        ...p,
        amount: p.amount_cents / 100
      })) || [],
      clicksByDay
    })

  } catch (error) {
    console.error('Error in GET /api/affiliate:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/affiliate - Activar programa de afiliados
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticacion y suscripcion activa
    const student = await verifyActiveSubscription()

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Requiere suscripcion activa', requiresSubscription: true },
        { status: 403 }
      )
    }

    const studentId = student.id

    // Verificar si ya es afiliado
    const { data: existingAffiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('student_id', studentId)
      .single()

    if (existingAffiliate) {
      return NextResponse.json(
        { success: false, error: 'Ya eres afiliado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { paypal_email } = body

    // Crear registro de afiliado
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .insert({
        student_id: studentId,
        referral_code: student.student_code,
        paypal_email: paypal_email || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating affiliate:', error)
      return NextResponse.json(
        { success: false, error: 'Error al activar programa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      affiliate: {
        ...affiliate,
        total_earnings: 0,
        pending_balance: 0,
        paid_balance: 0
      }
    })

  } catch (error) {
    console.error('Error in POST /api/affiliate:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/affiliate - Actualizar datos del afiliado
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticacion y suscripcion activa
    const student = await verifyActiveSubscription()

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Requiere suscripcion activa', requiresSubscription: true },
        { status: 403 }
      )
    }

    const studentId = student.id

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('student_id', studentId)
      .single()

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'No eres afiliado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { paypal_email } = body

    const { error } = await supabase
      .from('affiliates')
      .update({
        paypal_email,
        updated_at: new Date().toISOString()
      })
      .eq('id', affiliate.id)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in PATCH /api/affiliate:', error)
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
