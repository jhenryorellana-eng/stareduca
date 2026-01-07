import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, reactivateSubscription, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { APP_URL } from '@/lib/constants'

export async function POST() {
  try {
    // Verificar autenticación
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
        stripe_customer_id,
        subscription_status,
        subscription_type,
        subscription_end_date
      `)
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Caso 1: Suscripción activa con cancelación pendiente
    if (student.subscription_status === 'active' && student.stripe_customer_id) {
      // Buscar suscripción activa en Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: student.stripe_customer_id,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        const stripeSubscription = subscriptions.data[0]

        // Si tiene cancelación pendiente, reactivar
        if (stripeSubscription.cancel_at_period_end) {
          await reactivateSubscription(stripeSubscription.id)

          // Actualizar en la base de datos
          await adminClient
            .from('subscriptions')
            .update({
              cancel_at_period_end: false,
            })
            .eq('student_id', student.id)
            .eq('status', 'active')

          return NextResponse.json({
            success: true,
            message: 'Tu suscripcion ha sido reactivada',
            type: 'reactivated',
          })
        } else {
          return NextResponse.json(
            { success: false, error: 'Tu suscripcion ya esta activa' },
            { status: 400 }
          )
        }
      }
    }

    // Caso 2: Suscripción expirada o cancelada - crear nueva checkout session
    const subscriptionType = student.subscription_type || 'monthly'
    const priceId = subscriptionType === 'yearly'
      ? STRIPE_PRICE_IDS.yearly
      : STRIPE_PRICE_IDS.monthly

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkoutParams: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        studentId: student.id,
        fullName: student.full_name,
        email: student.email,
        type: 'reactivation',
      },
      subscription_data: {
        metadata: {
          studentId: student.id,
          fullName: student.full_name,
          email: student.email,
          type: 'reactivation',
        },
      },
      success_url: `${APP_URL}/settings/subscription?reactivate=success`,
      cancel_url: `${APP_URL}/settings/subscription?reactivate=cancelled`,
      allow_promotion_codes: true,
      locale: 'es',
    }

    // Si tiene customer_id, usarlo
    if (student.stripe_customer_id) {
      checkoutParams.customer = student.stripe_customer_id
    } else {
      checkoutParams.customer_email = student.email
    }

    const session = await stripe.checkout.sessions.create(checkoutParams)

    return NextResponse.json({
      success: true,
      type: 'checkout',
      checkoutUrl: session.url,
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Error in POST /api/subscriptions/reactivate:', error)
    return NextResponse.json(
      { success: false, error: 'Error al reactivar la suscripcion' },
      { status: 500 }
    )
  }
}
