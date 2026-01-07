// ============================================================================
// API: COMPLETAR REGISTRO
// POST /api/auth/complete-registration
// Crea el estudiante después del pago exitoso y establece la contraseña
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyPaymentSuccess, getStripePrice, STRIPE_PRICE_IDS } from '@/lib/stripe'
import { sendWelcomeEmail, sendPaymentConfirmationEmail } from '@/lib/resend'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, password, pendingRegistrationId } = body

    // Validaciones
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'La contraseña es requerida' },
        { status: 400 }
      )
    }

    // Validar formato de contraseña (alfanumérico, mínimo 8 caracteres)
    const passwordRegex = /^[a-zA-Z0-9]{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe ser alfanumérica y tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    if (!sessionId && !pendingRegistrationId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere sessionId o pendingRegistrationId' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    let pendingRegistration
    let stripePaymentData: {
      paymentIntentId: string | null
      amountCents: number
      currency: string
      subscriptionId: string | null
      customerId: string | null
    } | null = null

    // Para pagos con Stripe
    if (sessionId) {
      // Verificar pago en Stripe
      const paymentResult = await verifyPaymentSuccess(sessionId)

      if (!paymentResult.success) {
        return NextResponse.json(
          { success: false, error: paymentResult.error || 'El pago no se ha completado' },
          { status: 400 }
        )
      }

      // Guardar datos del pago para crear registro después
      if (paymentResult.session) {
        const session = paymentResult.session
        stripePaymentData = {
          paymentIntentId: typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null,
          amountCents: session.amount_total || 0,
          currency: (session.currency || 'usd').toUpperCase(),
          subscriptionId: paymentResult.subscriptionId || null,
          customerId: paymentResult.customerId || null,
        }
      }

      // Obtener registro pendiente
      const { data, error } = await supabase
        .from('pending_registrations')
        .select('*')
        .eq('checkout_session_id', sessionId)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: 'Registro no encontrado o ya completado' },
          { status: 404 }
        )
      }

      pendingRegistration = data
    }

    // Para pagos con Culqi
    if (pendingRegistrationId) {
      const { data, error } = await supabase
        .from('pending_registrations')
        .select('*')
        .eq('id', pendingRegistrationId)
        .eq('status', 'paid')
        .single()

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: 'Registro no encontrado, pago no verificado o ya completado' },
          { status: 404 }
        )
      }

      pendingRegistration = data
    }

    // Verificar que no haya expirado
    if (new Date(pendingRegistration.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'El registro ha expirado. Por favor, inicia el proceso nuevamente.' },
        { status: 400 }
      )
    }

    // Obtener precio real de Stripe
    const priceId = pendingRegistration.plan === 'monthly'
      ? STRIPE_PRICE_IDS.monthly
      : STRIPE_PRICE_IDS.yearly

    let stripePriceCents = pendingRegistration.plan === 'monthly' ? 1499 : 9900 // Fallback
    let stripeCurrency = 'USD'

    try {
      const stripePrice = await getStripePrice(priceId)
      stripePriceCents = stripePrice.amount
      stripeCurrency = stripePrice.currency
    } catch (priceError) {
      console.error('Error al obtener precio de Stripe, usando fallback:', priceError)
    }

    // Enviar email de confirmacion de pago (solo para Stripe, Culqi ya lo envia en create-charge)
    if (pendingRegistration.payment_provider === 'stripe') {
      try {
        await sendPaymentConfirmationEmail({
          to: pendingRegistration.email,
          fullName: pendingRegistration.full_name,
          amount: stripePriceCents / 100,
          currency: stripeCurrency,
          plan: pendingRegistration.plan,
          paymentMethod: 'Tarjeta de Credito',
        })
      } catch (emailError) {
        console.error('Error al enviar email de confirmacion de pago:', emailError)
        // No fallamos por error de email
      }
    }

    // Hashear contraseña
    const passwordHash = await hash(password, 12)

    // Calcular fecha de fin de suscripción
    const subscriptionEndDate = new Date()
    if (pendingRegistration.plan === 'monthly') {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
    } else {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
    }

    // Crear estudiante (el trigger generará student_code y generated_email)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        email: pendingRegistration.email,
        full_name: pendingRegistration.full_name,
        password_hash: passwordHash,
        subscription_status: 'active',
        subscription_type: pendingRegistration.plan,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: subscriptionEndDate.toISOString(),
        referred_by_student_id: null, // Se actualizará si hay referral
        // Stripe customer ID (para gestión de suscripción)
        stripe_customer_id: stripePaymentData?.customerId || null,
        // Datos del hijo/estudiante
        child_first_name: pendingRegistration.child_first_name,
        child_last_name: pendingRegistration.child_last_name,
        child_age: pendingRegistration.child_age,
        child_city: pendingRegistration.child_city,
        child_country: pendingRegistration.child_country,
        // Datos del padre/tutor
        parent_first_name: pendingRegistration.parent_first_name,
        parent_last_name: pendingRegistration.parent_last_name,
        parent_email: pendingRegistration.parent_email,
        parent_whatsapp: pendingRegistration.parent_whatsapp,
      })
      .select('id, student_code, generated_email, full_name, email')
      .single()

    if (studentError || !student) {
      console.error('Error al crear estudiante:', studentError)
      return NextResponse.json(
        { success: false, error: 'Error al crear la cuenta' },
        { status: 500 }
      )
    }

    // Si hay código de referido, procesar afiliación
    if (pendingRegistration.referral_code) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, student_id')
        .eq('referral_code', pendingRegistration.referral_code)
        .single()

      if (affiliate) {
        // Actualizar referred_by_student_id
        await supabase
          .from('students')
          .update({ referred_by_student_id: affiliate.student_id })
          .eq('id', student.id)

        // Actualizar contador de referidos del afiliado
        await supabase.rpc('increment_affiliate_referrals', {
          affiliate_id: affiliate.id,
        })
      }
    }

    // Crear registro de suscripción
    await supabase.from('subscriptions').insert({
      student_id: student.id,
      payment_provider: pendingRegistration.payment_provider,
      external_subscription_id: stripePaymentData?.subscriptionId || sessionId || null,
      price_cents: stripePriceCents,
      currency: stripeCurrency,
      billing_cycle: pendingRegistration.plan,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: subscriptionEndDate.toISOString(),
    })

    // Crear registro de pago inicial (para que aparezca en el dashboard de ingresos y historial)
    if (pendingRegistration.payment_provider === 'stripe') {
      // Crear pago siempre para Stripe, usando fallbacks si paymentIntentId no está disponible
      // (las suscripciones de Stripe a veces no tienen payment_intent en la session)
      await supabase.from('payments').insert({
        student_id: student.id,
        payment_provider: 'stripe',
        external_payment_id: stripePaymentData?.paymentIntentId
          || stripePaymentData?.subscriptionId
          || sessionId
          || `stripe_${Date.now()}`,
        amount_cents: stripePaymentData?.amountCents || stripePriceCents,
        currency: stripePaymentData?.currency || stripeCurrency,
        status: 'succeeded',
        payment_method: 'card',
        metadata: {
          checkout_session_id: sessionId,
          subscription_id: stripePaymentData?.subscriptionId,
          type: 'initial_payment',
        },
      })
    } else if (pendingRegistration.payment_provider === 'culqi') {
      // Para Culqi, el pago ya debería estar registrado en create-charge
      // pero si no existe, lo creamos aquí
      await supabase.from('payments').insert({
        student_id: student.id,
        payment_provider: 'culqi',
        external_payment_id: pendingRegistration.culqi_charge_id || pendingRegistration.id,
        amount_cents: stripePriceCents,
        currency: stripeCurrency,
        status: 'succeeded',
        payment_method: 'card',
        metadata: {
          pending_registration_id: pendingRegistration.id,
          type: 'initial_payment',
        },
      })
    }

    // Marcar registro pendiente como completado
    await supabase
      .from('pending_registrations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', pendingRegistration.id)

    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: student.generated_email,
      password: password,
      email_confirm: true,
      user_metadata: {
        student_id: student.id,
        student_code: student.student_code,
        full_name: student.full_name,
        real_email: student.email,
      },
    })

    if (authError) {
      console.error('Error al crear usuario en Auth:', authError)
      // No fallamos aquí, el estudiante ya está creado
    }

    // Enviar email de bienvenida
    try {
      await sendWelcomeEmail({
        to: student.email,
        fullName: student.full_name,
        studentCode: student.student_code,
        generatedEmail: student.generated_email,
      })
    } catch (emailError) {
      console.error('Error al enviar email de bienvenida:', emailError)
      // No fallamos por error de email
    }

    // Crear sesión de autenticación
    const { data: session } = await supabase.auth.signInWithPassword({
      email: student.generated_email,
      password: password,
    })

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentCode: student.student_code,
        generatedEmail: student.generated_email,
        fullName: student.full_name,
      },
      session: session?.session,
      redirectUrl: '/dashboard',
    })
  } catch (error) {
    console.error('Error al completar registro:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
