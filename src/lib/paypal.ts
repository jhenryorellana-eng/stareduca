// ============================================================================
// PAYPAL PAYOUTS API INTEGRATION
// ============================================================================

const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com'

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface PayPalPayoutItem {
  recipient_type: 'EMAIL'
  amount: {
    value: string
    currency: string
  }
  receiver: string
  note?: string
  sender_item_id: string
}

interface PayPalPayoutResponse {
  batch_header: {
    payout_batch_id: string
    batch_status: string
  }
  links: Array<{ href: string; rel: string }>
}

interface PayPalPayoutStatusResponse {
  batch_header: {
    payout_batch_id: string
    batch_status: string
    time_completed?: string
  }
  items: Array<{
    payout_item_id: string
    transaction_status: string
    payout_item: {
      receiver: string
      amount: {
        value: string
        currency: string
      }
    }
    errors?: {
      name: string
      message: string
    }
  }>
}

// Obtener token de acceso de PayPal
async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`PayPal auth failed: ${error}`)
  }

  const data: PayPalTokenResponse = await response.json()
  return data.access_token
}

// Crear pago a un afiliado
export async function createPayout(params: {
  payoutId: string
  recipientEmail: string
  amountCents: number
  note?: string
}): Promise<PayPalPayoutResponse> {
  const { payoutId, recipientEmail, amountCents, note } = params

  const accessToken = await getAccessToken()

  const amount = (amountCents / 100).toFixed(2)

  const payload = {
    sender_batch_header: {
      sender_batch_id: `STAREDUCA_${payoutId}_${Date.now()}`,
      email_subject: 'Has recibido un pago de StarEduca',
      email_message: 'Gracias por ser parte de nuestro programa de afiliados. Este pago corresponde a tus comisiones acumuladas.',
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: amount,
          currency: 'USD',
        },
        receiver: recipientEmail,
        note: note || 'Pago de comisiones StarEduca',
        sender_item_id: payoutId,
      },
    ] as PayPalPayoutItem[],
  }

  const response = await fetch(`${PAYPAL_API_URL}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('PayPal payout error:', error)
    throw new Error(error.message || 'PayPal payout failed')
  }

  return response.json()
}

// Obtener estado de un payout
export async function getPayoutStatus(payoutBatchId: string): Promise<PayPalPayoutStatusResponse> {
  const accessToken = await getAccessToken()

  const response = await fetch(`${PAYPAL_API_URL}/v1/payments/payouts/${payoutBatchId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to get payout status')
  }

  return response.json()
}

// Verificar webhook signature de PayPal
export async function verifyWebhookSignature(params: {
  webhookId: string
  transmissionId: string
  transmissionTime: string
  certUrl: string
  authAlgo: string
  transmissionSig: string
  webhookEvent: object
}): Promise<boolean> {
  const accessToken = await getAccessToken()

  const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      webhook_id: params.webhookId,
      transmission_id: params.transmissionId,
      transmission_time: params.transmissionTime,
      cert_url: params.certUrl,
      auth_algo: params.authAlgo,
      transmission_sig: params.transmissionSig,
      webhook_event: params.webhookEvent,
    }),
  })

  if (!response.ok) {
    console.error('PayPal webhook verification failed')
    return false
  }

  const data = await response.json()
  return data.verification_status === 'SUCCESS'
}

// Mapear estado de PayPal a estado interno
export function mapPayPalStatus(paypalStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
  switch (paypalStatus) {
    case 'SUCCESS':
      return 'completed'
    case 'PENDING':
    case 'PROCESSING':
      return 'processing'
    case 'DENIED':
    case 'FAILED':
    case 'RETURNED':
    case 'BLOCKED':
    case 'UNCLAIMED':
    case 'ONHOLD':
      return 'failed'
    default:
      return 'pending'
  }
}
