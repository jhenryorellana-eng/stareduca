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
    const { fullName, email, plan, paymentProvider, referralCode } = body

    // Validaciones básicas
    if (!fullName || !email || !plan || !paymentProvider) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
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
        email: email.toLowerCase(),
        full_name: fullName,
        plan,
        payment_provider: 'stripe',
        checkout_session_id: sessionId,
        referral_code: validReferralCode,
        status: 'pending',
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
        id: tempId,
        email: email.toLowerCase(),
        full_name: fullName,
        plan,
        payment_provider: 'culqi',
        referral_code: validReferralCode,
        status: 'pending',
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
