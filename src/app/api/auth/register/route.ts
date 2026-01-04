// ============================================================================
// API: INICIAR REGISTRO
// POST /api/auth/register
// Crea un registro pendiente y redirige al checkout de pago
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import { APP_URL } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // Datos del hijo/estudiante
      childFirstName,
      childLastName,
      childAge,
      childCity,
      childCountry,
      // Datos del padre/tutor
      parentFirstName,
      parentLastName,
      parentEmail,
      parentWhatsapp,
      // Datos de suscripción
      fullName,
      email,
      plan,
      paymentProvider,
      referralCode,
    } = body

    // Validaciones básicas (campos originales)
    if (!fullName || !email || !plan || !paymentProvider) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validaciones de datos del hijo
    if (!childFirstName || !childLastName || !childAge || !childCity || !childCountry) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos del estudiante' },
        { status: 400 }
      )
    }

    // Validaciones de datos del padre
    if (!parentFirstName || !parentLastName || !parentEmail || !parentWhatsapp) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos del padre o tutor' },
        { status: 400 }
      )
    }

    // Validar edad del hijo
    if (typeof childAge !== 'number' || childAge < 5 || childAge > 99) {
      return NextResponse.json(
        { success: false, error: 'La edad del estudiante debe estar entre 5 y 99 años' },
        { status: 400 }
      )
    }

    if (!['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Plan inválido' },
        { status: 400 }
      )
    }

    if (!['stripe', 'culqi'].includes(paymentProvider)) {
      return NextResponse.json(
        { success: false, error: 'Proveedor de pago inválido' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verificar si el email ya está registrado
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Este email ya está registrado. Por favor, inicia sesión.' },
        { status: 400 }
      )
    }

    // Verificar código de referido si se proporciona
    let validReferralCode = referralCode
    if (referralCode) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, is_active')
        .eq('referral_code', referralCode)
        .single()

      if (!affiliate || !affiliate.is_active) {
        validReferralCode = null // Ignorar código inválido
      }
    }

    // Datos comunes para el registro pendiente
    const pendingRegistrationData = {
      email: email.toLowerCase(),
      full_name: fullName,
      plan,
      referral_code: validReferralCode,
      status: 'pending',
      // Nuevos campos del hijo
      child_first_name: childFirstName,
      child_last_name: childLastName,
      child_age: childAge,
      child_city: childCity,
      child_country: childCountry,
      // Nuevos campos del padre
      parent_first_name: parentFirstName,
      parent_last_name: parentLastName,
      parent_email: parentEmail.toLowerCase(),
      parent_whatsapp: parentWhatsapp,
    }

    // Para Stripe: crear checkout session
    if (paymentProvider === 'stripe') {
      const successUrl = `${APP_URL}/register/complete`
      const cancelUrl = `${APP_URL}/register?canceled=true`

      const { sessionId, checkoutUrl } = await createCheckoutSession({
        email: email.toLowerCase(),
        fullName,
        plan,
        referralCode: validReferralCode || undefined,
        successUrl,
        cancelUrl,
      })

      // Guardar registro pendiente
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

      await supabase.from('pending_registrations').insert({
        ...pendingRegistrationData,
        payment_provider: 'stripe',
        checkout_session_id: sessionId,
        expires_at: expiresAt.toISOString(),
      })

      return NextResponse.json({
        success: true,
        paymentProvider: 'stripe',
        checkoutUrl,
        sessionId,
      })
    }

    // Para Culqi: retornar datos para procesar en frontend
    if (paymentProvider === 'culqi') {
      // Guardar registro pendiente con ID temporal
      const tempId = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

      await supabase.from('pending_registrations').insert({
        ...pendingRegistrationData,
        id: tempId,
        payment_provider: 'culqi',
        expires_at: expiresAt.toISOString(),
      })

      return NextResponse.json({
        success: true,
        paymentProvider: 'culqi',
        pendingRegistrationId: tempId,
        // El frontend manejará el pago con Culqi.js
      })
    }

    return NextResponse.json(
      { success: false, error: 'Proveedor de pago no soportado' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
