// ============================================================================
// STRIPE - INTEGRACIÓN PARA PAGOS
// ============================================================================

import Stripe from 'stripe'
import { PRICES } from '@/lib/constants'

// Cliente Stripe del lado del servidor
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

// IDs de precios de Stripe (configurar en dashboard)
export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_YEARLY!,
}

// ============================================================================
// CREAR CHECKOUT SESSION
// ============================================================================

export interface CreateCheckoutParams {
  email: string
  fullName: string
  plan: 'monthly' | 'yearly'
  referralCode?: string
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const { email, fullName, plan, referralCode, successUrl, cancelUrl } = params

  const priceId = STRIPE_PRICE_IDS[plan]

  if (!priceId) {
    throw new Error(`No se encontró el precio para el plan: ${plan}`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      fullName,
      email,
      plan,
      referralCode: referralCode || '',
      source: 'stareduca_registration',
    },
    subscription_data: {
      metadata: {
        fullName,
        email,
        plan,
        referralCode: referralCode || '',
      },
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'es',
    custom_text: {
      submit: {
        message: `Suscripción ${plan === 'monthly' ? 'mensual' : 'anual'} a StarEduca`,
      },
    },
  })

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  }
}

// ============================================================================
// OBTENER CHECKOUT SESSION
// ============================================================================

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  })

  return session
}

// ============================================================================
// VERIFICAR PAGO EXITOSO
// ============================================================================

export async function verifyPaymentSuccess(sessionId: string) {
  const session = await getCheckoutSession(sessionId)

  if (session.payment_status !== 'paid') {
    return {
      success: false,
      error: 'El pago no se ha completado',
    }
  }

  return {
    success: true,
    session,
    metadata: session.metadata,
    customerId: session.customer as string,
    subscriptionId: session.subscription as string,
    amountTotal: session.amount_total,
    currency: session.currency,
  }
}

// ============================================================================
// CREAR CUSTOMER
// ============================================================================

export async function createCustomer(params: {
  email: string
  name: string
  metadata?: Record<string, string>
}) {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  })

  return customer
}

// ============================================================================
// OBTENER SUSCRIPCIÓN
// ============================================================================

export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

// ============================================================================
// CANCELAR SUSCRIPCIÓN
// ============================================================================

export async function cancelSubscription(subscriptionId: string, immediately = false) {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId)
  }

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

// ============================================================================
// REACTIVAR SUSCRIPCIÓN
// ============================================================================

export async function reactivateSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

// ============================================================================
// CREAR PORTAL SESSION (para que el usuario gestione su suscripción)
// ============================================================================

export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// ============================================================================
// VERIFICAR WEBHOOK SIGNATURE
// ============================================================================

export function constructWebhookEvent(payload: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

// ============================================================================
// MAPEAR ESTADO DE SUSCRIPCIÓN
// ============================================================================

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing' {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled'
    case 'incomplete':
    case 'paused':
    default:
      return 'inactive'
  }
}

// ============================================================================
// OBTENER PRECIO DISPLAY
// ============================================================================

export function getPriceDisplay(plan: 'monthly' | 'yearly', currency = 'USD') {
  const prices = PRICES[currency as keyof typeof PRICES] || PRICES.USD

  const amount = prices[plan] / 100
  const symbol = currency === 'PEN' ? 'S/' : '$'

  return {
    amount,
    formatted: `${symbol}${amount.toFixed(2)}`,
    period: plan === 'monthly' ? '/mes' : '/año',
    savings: plan === 'yearly' ? Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100) : 0,
  }
}
