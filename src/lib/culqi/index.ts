// ============================================================================
// CULQI - INTEGRACIÓN PARA PAGOS EN PERÚ (YAPE)
// ============================================================================

import { PRICES } from '@/lib/constants'

const CULQI_API_URL = 'https://api.culqi.com/v2'

// ============================================================================
// TIPOS
// ============================================================================

export interface CulqiChargeParams {
  email: string
  fullName: string
  plan: 'monthly' | 'yearly'
  token: string // Token generado por Culqi.js en el frontend
  referralCode?: string
}

export interface CulqiChargeResponse {
  id: string
  object: string
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

export interface CulqiError {
  object: string
  type: string
  merchant_message: string
  user_message: string
}

// ============================================================================
// CREAR CARGO (CHARGE)
// ============================================================================

export async function createCharge(params: CulqiChargeParams): Promise<{
  success: boolean
  charge?: CulqiChargeResponse
  error?: string
}> {
  const { email, fullName, plan, token, referralCode } = params

  const amount = PRICES.PEN[plan] // Precio en céntimos

  try {
    const response = await fetch(`${CULQI_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency_code: 'PEN',
        email,
        source_id: token,
        description: `StarEduca - Plan ${plan === 'monthly' ? 'Mensual' : 'Anual'}`,
        capture: true, // Capturar el pago inmediatamente
        metadata: {
          fullName,
          plan,
          referralCode: referralCode || '',
          source: 'stareduca_registration',
        },
        antifraud_details: {
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ').slice(1).join(' ') || fullName,
          email,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const error = data as CulqiError
      return {
        success: false,
        error: error.user_message || error.merchant_message || 'Error al procesar el pago',
      }
    }

    return {
      success: true,
      charge: data as CulqiChargeResponse,
    }
  } catch (error) {
    console.error('Error al crear cargo en Culqi:', error)
    return {
      success: false,
      error: 'Error de conexión con el procesador de pagos',
    }
  }
}

// ============================================================================
// OBTENER CARGO
// ============================================================================

export async function getCharge(chargeId: string): Promise<CulqiChargeResponse | null> {
  try {
    const response = await fetch(`${CULQI_API_URL}/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error al obtener cargo de Culqi:', error)
    return null
  }
}

// ============================================================================
// CREAR CLIENTE
// ============================================================================

export async function createCustomer(params: {
  email: string
  firstName: string
  lastName: string
  phone?: string
}): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const response = await fetch(`${CULQI_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: params.firstName,
        last_name: params.lastName,
        email: params.email,
        address: 'Lima, Peru',
        address_city: 'Lima',
        country_code: 'PE',
        phone_number: params.phone || '999999999',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.user_message || 'Error al crear cliente',
      }
    }

    return {
      success: true,
      customerId: data.id,
    }
  } catch (error) {
    console.error('Error al crear cliente en Culqi:', error)
    return {
      success: false,
      error: 'Error de conexión',
    }
  }
}

// ============================================================================
// CREAR REEMBOLSO
// ============================================================================

export async function createRefund(chargeId: string, reason?: string): Promise<{
  success: boolean
  refundId?: string
  error?: string
}> {
  try {
    const response = await fetch(`${CULQI_API_URL}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        charge_id: chargeId,
        reason: reason || 'solicitud del cliente',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.user_message || 'Error al crear reembolso',
      }
    }

    return {
      success: true,
      refundId: data.id,
    }
  } catch (error) {
    console.error('Error al crear reembolso en Culqi:', error)
    return {
      success: false,
      error: 'Error de conexión',
    }
  }
}

// ============================================================================
// VERIFICAR WEBHOOK SIGNATURE
// ============================================================================

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Culqi usa HMAC-SHA256 para firmar los webhooks
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return signature === expectedSignature
}

// ============================================================================
// MAPEAR ESTADO DE CARGO
// ============================================================================

export function mapCulqiChargeStatus(
  outcomeType: string
): 'succeeded' | 'failed' | 'pending' {
  switch (outcomeType) {
    case 'venta_exitosa':
      return 'succeeded'
    case 'venta_rechazada':
    case 'error':
      return 'failed'
    default:
      return 'pending'
  }
}

// ============================================================================
// OBTENER PRECIO DISPLAY PARA PERÚ
// ============================================================================

export function getPENPriceDisplay(plan: 'monthly' | 'yearly') {
  const amount = PRICES.PEN[plan] / 100

  return {
    amount,
    formatted: `S/${amount.toFixed(2)}`,
    period: plan === 'monthly' ? '/mes' : '/año',
    savings: plan === 'yearly' ? Math.round((1 - PRICES.PEN.yearly / (PRICES.PEN.monthly * 12)) * 100) : 0,
  }
}

// ============================================================================
// SCRIPT URL PARA CULQI.JS (FRONTEND)
// ============================================================================

export const CULQI_JS_URL = 'https://checkout.culqi.com/js/v4'

export function getCulqiPublicKey() {
  return process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY
}
