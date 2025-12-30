import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createPayout } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  try {
    // Obtener datos del request
    const { payoutId } = await request.json()

    if (!payoutId) {
      return NextResponse.json(
        { error: 'Payout ID is required' },
        { status: 400 }
      )
    }

    // Usar admin client para acceso completo
    const supabase = createAdminClient()

    // Obtener datos del payout
    const { data: payout, error: payoutError } = await supabase
      .from('affiliate_payouts')
      .select(`
        id,
        amount_cents,
        status,
        affiliate:affiliates!affiliate_payouts_affiliate_id_fkey(
          id,
          paypal_email,
          user_id,
          pending_balance_cents
        )
      `)
      .eq('id', payoutId)
      .single()

    if (payoutError || !payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      )
    }

    // Verificar estado
    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: 'Payout is not in pending status' },
        { status: 400 }
      )
    }

    // Verificar email de PayPal
    if (!payout.affiliate?.paypal_email) {
      return NextResponse.json(
        { error: 'Affiliate has no PayPal email configured' },
        { status: 400 }
      )
    }

    // Actualizar estado a processing
    await supabase
      .from('affiliate_payouts')
      .update({ status: 'processing' })
      .eq('id', payoutId)

    try {
      // Crear payout en PayPal
      const paypalResponse = await createPayout({
        payoutId: payout.id,
        recipientEmail: payout.affiliate.paypal_email,
        amountCents: payout.amount_cents,
        note: 'Pago de comisiones StarEduca',
      })

      // Guardar batch ID de PayPal
      await supabase
        .from('affiliate_payouts')
        .update({
          payment_details: {
            email: payout.affiliate.paypal_email,
            paypal_batch_id: paypalResponse.batch_header.payout_batch_id,
          },
        })
        .eq('id', payoutId)

      return NextResponse.json({
        success: true,
        paypalBatchId: paypalResponse.batch_header.payout_batch_id,
      })

    } catch (paypalError) {
      // Revertir estado si PayPal falla
      await supabase
        .from('affiliate_payouts')
        .update({
          status: 'failed',
          payment_details: {
            email: payout.affiliate.paypal_email,
            error: paypalError instanceof Error ? paypalError.message : 'PayPal error',
          },
        })
        .eq('id', payoutId)

      throw paypalError
    }

  } catch (error) {
    console.error('Create payout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
