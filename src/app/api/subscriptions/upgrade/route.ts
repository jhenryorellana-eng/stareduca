import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { APP_URL } from '@/lib/constants'

export async function POST() {
  try {
    // Verificar autenticacion
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const studentId = user.user_metadata?.student_id
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Obtener datos del estudiante
    const { data: student, error: studentError } = await adminClient
      .from('students')
      .select(`
        id,
        full_name,
        email,
        generated_email,
        subscription_status,
        subscription_type,
        stripe_customer_id
      `)
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que tiene suscripcion activa
    if (student.subscription_status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'No tienes una suscripcion activa' },
        { status: 400 }
      )
    }

    // Verificar que no es ya anual
    if (student.subscription_type === 'yearly') {
      return NextResponse.json(
        { success: false, error: 'Ya tienes el plan anual' },
        { status: 400 }
      )
    }

    // Obtener el price ID anual
    const yearlyPriceId = STRIPE_PRICE_IDS.yearly
    if (!yearlyPriceId) {
      return NextResponse.json(
        { success: false, error: 'Precio anual no configurado' },
        { status: 500 }
      )
    }

    // Crear checkout session para upgrade
    // Si ya tiene customer_id en Stripe, usarlo
    const checkoutParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: yearlyPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        studentId: student.id,
        fullName: student.full_name,
        email: student.email,
        previousPlan: 'monthly',
        newPlan: 'yearly',
        type: 'upgrade',
      },
      subscription_data: {
        metadata: {
          studentId: student.id,
          fullName: student.full_name,
          email: student.email,
          type: 'upgrade',
        },
      },
      success_url: `${APP_URL}/settings/subscription?upgrade=success`,
      cancel_url: `${APP_URL}/settings/subscription?upgrade=cancelled`,
      allow_promotion_codes: true,
      locale: 'es',
      custom_text: {
        submit: {
          message: 'Upgrade a Plan Anual StarEduca - $99.00/año',
        },
      },
    }

    // Si tiene customer_id, usarlo para asociar
    if (student.stripe_customer_id) {
      checkoutParams.customer = student.stripe_customer_id
    } else {
      checkoutParams.customer_email = student.email
    }

    const session = await stripe.checkout.sessions.create(checkoutParams)

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Error in POST /api/subscriptions/upgrade:', error)
    return NextResponse.json(
      { success: false, error: 'Error al iniciar el proceso de upgrade' },
      { status: 500 }
    )
  }
}
