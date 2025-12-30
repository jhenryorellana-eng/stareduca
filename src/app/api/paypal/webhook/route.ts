import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, mapPayPalStatus } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  try {
    // Obtener headers de PayPal
    const transmissionId = request.headers.get('paypal-transmission-id')
    const transmissionTime = request.headers.get('paypal-transmission-time')
    const certUrl = request.headers.get('paypal-cert-url')
    const authAlgo = request.headers.get('paypal-auth-algo')
    const transmissionSig = request.headers.get('paypal-transmission-sig')

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.error('Missing PayPal webhook headers')
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 })
    }

    // Obtener body del webhook
    const webhookEvent = await request.json()

    // Verificar firma (en producción)
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (webhookId && process.env.PAYPAL_MODE === 'live') {
      const isValid = await verifyWebhookSignature({
        webhookId,
        transmissionId,
        transmissionTime,
        certUrl,
        authAlgo,
        transmissionSig,
        webhookEvent,
      })

      if (!isValid) {
        console.error('Invalid PayPal webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const eventType = webhookEvent.event_type
    console.log('PayPal webhook event:', eventType)

    // Procesar eventos de payout
    if (eventType.startsWith('PAYMENT.PAYOUTS')) {
      await handlePayoutEvent(webhookEvent)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('PayPal webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handlePayoutEvent(event: {
  event_type: string
  resource: {
    batch_header?: {
      payout_batch_id: string
      batch_status: string
      time_completed?: string
    }
    sender_batch_id?: string
    payout_item?: {
      sender_item_id: string
    }
    transaction_status?: string
    payout_item_id?: string
  }
}) {
  const supabase = createAdminClient()

  // Obtener el payout_id del sender_batch_id o sender_item_id
  let payoutId: string | null = null

  if (event.resource.sender_batch_id) {
    // Formato: STAREDUCA_{payoutId}_{timestamp}
    const parts = event.resource.sender_batch_id.split('_')
    if (parts.length >= 2 && parts[0] === 'STAREDUCA') {
      payoutId = parts[1]
    }
  } else if (event.resource.payout_item?.sender_item_id) {
    payoutId = event.resource.payout_item.sender_item_id
  }

  if (!payoutId) {
    console.log('Could not extract payout ID from webhook')
    return
  }

  const eventType = event.event_type

  switch (eventType) {
    case 'PAYMENT.PAYOUTSBATCH.SUCCESS':
      // Batch completado exitosamente
      await handlePayoutSuccess(supabase, payoutId, event.resource.batch_header?.time_completed)
      break

    case 'PAYMENT.PAYOUTSBATCH.DENIED':
    case 'PAYMENT.PAYOUTSITEM.BLOCKED':
    case 'PAYMENT.PAYOUTSITEM.FAILED':
    case 'PAYMENT.PAYOUTSITEM.DENIED':
    case 'PAYMENT.PAYOUTSITEM.RETURNED':
    case 'PAYMENT.PAYOUTSITEM.UNCLAIMED':
      // Payout falló
      await handlePayoutFailure(supabase, payoutId, event.resource.transaction_status || 'FAILED')
      break

    case 'PAYMENT.PAYOUTSITEM.SUCCEEDED':
      // Item individual completado
      await handlePayoutSuccess(supabase, payoutId)
      break

    default:
      console.log('Unhandled PayPal event type:', eventType)
  }
}

async function handlePayoutSuccess(
  supabase: ReturnType<typeof createAdminClient>,
  payoutId: string,
  completedAt?: string
) {
  // Obtener el payout
  const { data: payout } = await supabase
    .from('affiliate_payouts')
    .select('id, amount_cents, affiliate_id')
    .eq('id', payoutId)
    .single()

  if (!payout) {
    console.error('Payout not found:', payoutId)
    return
  }

  // Actualizar estado del payout
  await supabase
    .from('affiliate_payouts')
    .update({
      status: 'completed',
      processed_at: completedAt || new Date().toISOString(),
    })
    .eq('id', payoutId)

  // Actualizar balances del afiliado
  await supabase.rpc('process_payout_completion', {
    p_affiliate_id: payout.affiliate_id,
    p_amount_cents: payout.amount_cents,
  })

  console.log(`Payout ${payoutId} completed successfully`)
}

async function handlePayoutFailure(
  supabase: ReturnType<typeof createAdminClient>,
  payoutId: string,
  reason: string
) {
  // Primero obtener payment_details actual
  const { data: currentPayout } = await supabase
    .from('affiliate_payouts')
    .select('payment_details')
    .eq('id', payoutId)
    .single()

  // Actualizar estado del payout con el failure_reason
  await supabase
    .from('affiliate_payouts')
    .update({
      status: 'failed',
      payment_details: {
        ...(currentPayout?.payment_details || {}),
        failure_reason: reason,
      },
    })
    .eq('id', payoutId)

  console.log(`Payout ${payoutId} failed: ${reason}`)
}
