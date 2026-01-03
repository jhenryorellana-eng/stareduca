// ============================================================================
// WEBHOOK DE CULQI
// POST /api/payments/culqi/webhook
// Maneja eventos de Culqi (pagos con Yape)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, mapCulqiChargeStatus } from '@/lib/culqi'

interface CulqiWebhookEvent {
  object: string
  type: string
  id: string
  data: {
    object: {
      id: string
      amount: number
      currency_code: string
      email: string
      source_id: string
      outcome: {
        type: string
        code: string
        merchant_message: string
        user_message: string
      }
      metadata: Record<string, string>
      created_at: number
    }
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('x-culqi-signature') || ''
  const webhookSecret = process.env.CULQI_WEBHOOK_SECRET || ''

  // Verificar firma si está configurada
  if (webhookSecret && !verifyWebhookSignature(payload, signature, webhookSecret)) {
    console.error('Firma de webhook Culqi inválida')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  let event: CulqiWebhookEvent

  try {
    event = JSON.parse(payload)
  } catch (err) {
    console.error('Error parseando webhook Culqi:', err)
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // =====================================================================
      // CARGO EXITOSO
      // =====================================================================
      case 'charge.creation.succeeded': {
        const charge = event.data.object

        console.log('Culqi charge succeeded:', charge.id)

        const status = mapCulqiChargeStatus(charge.outcome.type)

        if (status === 'succeeded') {
          const metadata = charge.metadata
          const email = charge.email.toLowerCase()

          // Buscar registro pendiente
          const { data: pendingReg } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('email', email)
            .eq('payment_provider', 'culqi')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (pendingReg) {
            // Marcar como pagado (el usuario aún necesita crear contraseña)
            await supabase
              .from('pending_registrations')
              .update({
                checkout_session_id: charge.id, // Guardar ID del cargo
              })
              .eq('id', pendingReg.id)
          }

          // Si es una renovación (estudiante existente)
          const { data: student } = await supabase
            .from('students')
            .select('id, referred_by_student_id')
            .eq('email', email)
            .single()

          if (student) {
            // Calcular nueva fecha de fin
            const plan = metadata.plan as 'monthly' | 'yearly'
            const subscriptionEndDate = new Date()
            if (plan === 'monthly') {
              subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
            } else {
              subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
            }

            await supabase
              .from('students')
              .update({
                subscription_status: 'active',
                subscription_end_date: subscriptionEndDate.toISOString(),
              })
              .eq('id', student.id)

            // Registrar pago
            await supabase.from('payments').insert({
              student_id: student.id,
              payment_provider: 'culqi',
              external_payment_id: charge.id,
              amount_cents: charge.amount,
              currency: charge.currency_code,
              status: 'succeeded',
              payment_method: 'yape',
              metadata: {
                culqi_source_id: charge.source_id,
                outcome_type: charge.outcome.type,
              },
            })

            // Generar comisión si tiene referido
            if (student.referred_by_student_id) {
              const { data: affiliate } = await supabase
                .from('affiliates')
                .select('id')
                .eq('student_id', student.referred_by_student_id)
                .single()

              if (affiliate) {
                const commissionCents = Math.round(charge.amount * 0.80)

                await supabase.from('affiliate_commissions').insert({
                  affiliate_id: affiliate.id,
                  referred_student_id: student.id,
                  subscription_amount_cents: charge.amount,
                  commission_cents: commissionCents,
                  commission_rate: 0.80,
                  status: 'pending',
                })
              }
            }
          }
        }
        break
      }

      // =====================================================================
      // CARGO FALLIDO
      // =====================================================================
      case 'charge.creation.failed': {
        const charge = event.data.object

        console.log('Culqi charge failed:', charge.id, charge.outcome.merchant_message)

        const email = charge.email.toLowerCase()

        // Buscar estudiante
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('email', email)
          .single()

        if (student) {
          // Registrar pago fallido
          await supabase.from('payments').insert({
            student_id: student.id,
            payment_provider: 'culqi',
            external_payment_id: charge.id,
            amount_cents: charge.amount,
            currency: charge.currency_code,
            status: 'failed',
            payment_method: 'yape',
            error_message: charge.outcome.user_message || charge.outcome.merchant_message,
          })
        }
        break
      }

      // =====================================================================
      // REEMBOLSO
      // =====================================================================
      case 'refund.creation.succeeded': {
        const refund = event.data.object

        console.log('Culqi refund succeeded:', refund.id)

        // Actualizar pago original
        const chargeId = (refund as any).charge_id

        await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('external_payment_id', chargeId)
        break
      }

      default:
        console.log(`Evento Culqi no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error procesando webhook Culqi:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
