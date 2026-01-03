// ============================================================================
// WEBHOOK DE STRIPE
// POST /api/payments/stripe/webhook
// Maneja eventos de Stripe (pagos, suscripciones, etc.)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { constructWebhookEvent, mapStripeSubscriptionStatus } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(Buffer.from(payload), signature)
  } catch (err) {
    console.error('Error verificando webhook:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // =====================================================================
      // CHECKOUT COMPLETADO
      // =====================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('Checkout session completed:', session.id)

        // El registro se completará cuando el usuario cree su contraseña
        // Aquí solo actualizamos el estado si es necesario
        break
      }

      // =====================================================================
      // PAGO DE FACTURA EXITOSO (RENOVACIÓN)
      // =====================================================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoiceAny = invoice as any
        const subscriptionId = typeof invoiceAny.subscription === 'string'
          ? invoiceAny.subscription
          : invoiceAny.subscription?.id || null

        console.log('Invoice payment succeeded:', invoice.id)

        // Buscar estudiante por stripe_customer_id
        const { data: student } = await supabase
          .from('students')
          .select('id, referred_by_student_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (student) {
          // Actualizar estado de suscripción
          const periodEnd = invoice.lines.data[0]?.period?.end
          const subscriptionEndDate = periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          await supabase
            .from('students')
            .update({
              subscription_status: 'active',
              subscription_end_date: subscriptionEndDate,
            })
            .eq('id', student.id)

          // Actualizar suscripción
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_end: subscriptionEndDate,
            })
            .eq('external_subscription_id', subscriptionId)

          // Registrar pago
          await supabase.from('payments').insert({
            student_id: student.id,
            payment_provider: 'stripe',
            external_payment_id: invoiceAny.payment_intent as string,
            amount_cents: invoiceAny.amount_paid,
            currency: invoiceAny.currency?.toUpperCase() || 'USD',
            status: 'succeeded',
            payment_method: 'card',
            metadata: {
              invoice_id: invoice.id,
              subscription_id: subscriptionId,
            },
          })

          // Si tiene referido, generar comisión para el afiliado
          if (student.referred_by_student_id) {
            const { data: affiliate } = await supabase
              .from('affiliates')
              .select('id')
              .eq('student_id', student.referred_by_student_id)
              .single()

            if (affiliate) {
              const commissionCents = Math.round(invoiceAny.amount_paid * 0.80)

              await supabase.from('affiliate_commissions').insert({
                affiliate_id: affiliate.id,
                referred_student_id: student.id,
                subscription_amount_cents: invoice.amount_paid,
                commission_cents: commissionCents,
                commission_rate: 0.80,
                status: 'pending',
              })

              // Actualizar balance pendiente del afiliado
              await supabase.rpc('update_affiliate_balance', {
                p_affiliate_id: affiliate.id,
                p_amount_cents: commissionCents,
              })
            }
          }
        }
        break
      }

      // =====================================================================
      // PAGO DE FACTURA FALLIDO
      // =====================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoiceFailedAny = invoice as any
        const customerId = invoice.customer as string

        console.log('Invoice payment failed:', invoice.id)

        await supabase
          .from('students')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        // Registrar intento de pago fallido
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (student) {
          await supabase.from('payments').insert({
            student_id: student.id,
            payment_provider: 'stripe',
            external_payment_id: invoiceFailedAny.payment_intent as string || invoice.id,
            amount_cents: invoiceFailedAny.amount_due,
            currency: invoiceFailedAny.currency?.toUpperCase() || 'USD',
            status: 'failed',
            error_message: 'Payment failed',
          })
        }
        break
      }

      // =====================================================================
      // SUSCRIPCIÓN ACTUALIZADA
      // =====================================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subAny = subscription as any
        const customerId = subscription.customer as string
        const status = mapStripeSubscriptionStatus(subscription.status)

        console.log('Subscription updated:', subscription.id, status)

        await supabase
          .from('students')
          .update({
            subscription_status: status,
            subscription_end_date: new Date(subAny.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        await supabase
          .from('subscriptions')
          .update({
            status,
            current_period_end: new Date(subAny.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subAny.cancel_at_period_end,
          })
          .eq('external_subscription_id', subscription.id)
        break
      }

      // =====================================================================
      // SUSCRIPCIÓN CANCELADA
      // =====================================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log('Subscription deleted:', subscription.id)

        await supabase
          .from('students')
          .update({ subscription_status: 'canceled' })
          .eq('stripe_customer_id', customerId)

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('external_subscription_id', subscription.id)

        // Desactivar afiliado si existe
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (student) {
          await supabase
            .from('affiliates')
            .update({ is_active: false })
            .eq('student_id', student.id)
        }
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error procesando webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
