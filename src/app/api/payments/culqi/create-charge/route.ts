// ============================================================================
// API: CREAR CARGO CON CULQI (YAPE)
// POST /api/payments/culqi/create-charge
// Procesa un pago con el token de Culqi generado en el frontend
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createCharge } from '@/lib/culqi'
import { sendPaymentConfirmationEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, pendingRegistrationId } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de pago requerido' },
        { status: 400 }
      )
    }

    if (!pendingRegistrationId) {
      return NextResponse.json(
        { success: false, error: 'ID de registro pendiente requerido' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Obtener registro pendiente
    const { data: pendingReg, error: regError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('id', pendingRegistrationId)
      .eq('payment_provider', 'culqi')
      .eq('status', 'pending')
      .single()

    if (regError || !pendingReg) {
      return NextResponse.json(
        { success: false, error: 'Registro no encontrado o ya procesado' },
        { status: 404 }
      )
    }

    // Verificar que no haya expirado
    if (new Date(pendingReg.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'El registro ha expirado. Por favor, inicia el proceso nuevamente.' },
        { status: 400 }
      )
    }

    // Crear cargo en Culqi
    const chargeResult = await createCharge({
      email: pendingReg.email,
      fullName: pendingReg.full_name,
      plan: pendingReg.plan as 'monthly' | 'yearly',
      token,
      referralCode: pendingReg.referral_code || undefined,
    })

    if (!chargeResult.success || !chargeResult.charge) {
      return NextResponse.json(
        { success: false, error: chargeResult.error || 'Error al procesar el pago' },
        { status: 400 }
      )
    }

    // Actualizar registro pendiente con el ID del cargo y marcar como pagado
    await supabase
      .from('pending_registrations')
      .update({
        checkout_session_id: chargeResult.charge.id,
        status: 'paid',
      })
      .eq('id', pendingRegistrationId)

    // Enviar email de confirmacion de pago
    try {
      await sendPaymentConfirmationEmail({
        to: pendingReg.email,
        fullName: pendingReg.full_name,
        amount: pendingReg.plan === 'monthly' ? 35 : 315,
        currency: 'PEN',
        plan: pendingReg.plan as 'monthly' | 'yearly',
        paymentMethod: 'Yape',
      })
    } catch (emailError) {
      console.error('Error al enviar email de confirmacion de pago:', emailError)
      // No fallamos por error de email
    }

    return NextResponse.json({
      success: true,
      chargeId: chargeResult.charge.id,
      pendingRegistrationId,
    })
  } catch (error) {
    console.error('Error al crear cargo Culqi:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
