// ============================================================================
// TIPOS PARA STAREDUCA - SISTEMA DE AFILIADOS
// ============================================================================

// Tipos de base de datos
export interface App {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  ios_store_url: string | null
  android_store_url: string | null
  deep_link_scheme: string | null
  website_url: string | null
  commission_rate: number
  subscription_price_cents: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  role: 'user' | 'admin'
  subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due'
  stripe_customer_id: string | null
  referred_by_code: string | null
  created_at: string
  updated_at: string
}

export interface Affiliate {
  id: string
  user_id: string
  app_id: string
  student_code: string
  referral_code: string
  paypal_email: string | null
  is_active: boolean
  total_earnings_cents: number
  pending_balance_cents: number
  paid_balance_cents: number
  referral_count: number
  active_referrals: number
  link_clicks: number
  created_at: string
  updated_at: string
  // Relaciones
  profile?: Profile
  app?: App
}

export type ReferralStatus = 'pending' | 'converted' | 'active' | 'churned' | 'expired'

export interface AffiliateReferral {
  id: string
  affiliate_id: string
  app_id: string
  referred_user_id: string | null
  referral_code: string
  stripe_customer_id: string | null
  status: ReferralStatus
  converted_at: string | null
  last_payment_at: string | null
  total_payments: number
  created_at: string
  updated_at: string
  // Relaciones
  referred_user?: Profile
}

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled'

export interface AffiliateCommission {
  id: string
  affiliate_id: string
  referral_id: string
  app_id: string
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
  subscription_amount_cents: number
  commission_cents: number
  commission_rate: number
  status: CommissionStatus
  period_start: string | null
  period_end: string | null
  paid_at: string | null
  payout_id: string | null
  notes: string | null
  created_at: string
  // Relaciones
  referral?: AffiliateReferral
}

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type PaymentMethod = 'paypal' | 'bank_transfer' | 'stripe' | 'crypto' | 'manual'

export interface AffiliatePayout {
  id: string
  affiliate_id: string
  amount_cents: number
  currency: string
  payment_method: PaymentMethod
  paypal_email: string | null
  paypal_payout_id: string | null
  paypal_batch_id: string | null
  payment_details: Record<string, unknown> | null
  status: PayoutStatus
  requested_at: string
  processed_at: string | null
  completed_at: string | null
  error_message: string | null
  notes: string | null
  created_at: string
}

export interface AffiliateLinkClick {
  id: string
  affiliate_id: string
  referral_code: string
  ip_address: string | null
  user_agent: string | null
  referer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  country: string | null
  device_type: string | null
  platform: string | null
  created_at: string
}

// ============================================================================
// TIPOS DE ESTADÍSTICAS
// ============================================================================

export interface AffiliateStats {
  total_clicks: number
  total_referrals: number
  active_referrals: number
  pending_referrals: number
  total_earnings_cents: number
  pending_balance_cents: number
  paid_balance_cents: number
  conversion_rate: number
}

export interface CommissionsByPeriod {
  total_commissions: number
  total_amount_cents: number
  pending_amount_cents: number
  approved_amount_cents: number
  paid_amount_cents: number
}

export interface DashboardStats {
  totalEarnings: number
  pendingBalance: number
  paidBalance: number
  totalReferrals: number
  activeReferrals: number
  totalClicks: number
  conversionRate: number
  thisMonthEarnings: number
  thisMonthReferrals: number
}

// ============================================================================
// TIPOS DE FORMULARIOS
// ============================================================================

export interface RegisterFormData {
  email: string
  password: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface PayoutRequestFormData {
  amount_cents: number
  payment_method: PaymentMethod
  paypal_email?: string
}

export interface SettingsFormData {
  paypal_email: string
}

// ============================================================================
// TIPOS DE RESPUESTAS API
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ValidateReferralCodeResponse {
  is_valid: boolean
  affiliate_id: string | null
  affiliate_user_id: string | null
  app_id: string | null
  app_slug: string | null
  is_affiliate_active: boolean
}
