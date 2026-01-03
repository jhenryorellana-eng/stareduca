// ============================================================================
// TIPOS PARA STAREDUCA - PLATAFORMA EDUCATIVA
// ============================================================================

// ============================================================================
// ESTUDIANTES Y AUTENTICACIÓN
// ============================================================================

export type StudentRole = 'student' | 'instructor' | 'admin'
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing'
export type SubscriptionType = 'monthly' | 'yearly'

export interface Student {
  id: string
  email: string
  generated_email: string | null
  student_code: string | null
  full_name: string
  avatar_url: string | null
  role: StudentRole
  subscription_status: SubscriptionStatus
  subscription_type: SubscriptionType | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
  culqi_customer_id: string | null
  referred_by_student_id: string | null
  is_email_verified: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface StudentPublicProfile {
  id: string
  full_name: string
  avatar_url: string | null
  student_code: string | null
  role: StudentRole
  created_at: string
}

// ============================================================================
// CURSOS Y CAPÍTULOS
// ============================================================================

export interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  short_description: string | null
  thumbnail_url: string | null
  instructor_id: string | null
  instructor_name: string | null
  total_chapters: number
  total_duration_minutes: number
  is_published: boolean
  is_free: boolean
  is_featured: boolean
  order_index: number
  category: string | null
  tags: string[]
  created_at: string
  updated_at: string
  // Relaciones
  instructor?: StudentPublicProfile
  chapters?: Chapter[]
}

export interface Chapter {
  id: string
  course_id: string
  chapter_number: number
  title: string
  description: string | null
  content_html: string | null
  video_url: string | null
  video_duration_seconds: number
  is_free_preview: boolean
  order_index: number
  created_at: string
  updated_at: string
  // Relaciones
  materials?: ChapterMaterial[]
}

export type ChapterMaterialType = 'pdf' | 'link' | 'text' | 'download' | 'video'

export interface ChapterMaterial {
  id: string
  chapter_id: string
  title: string
  type: ChapterMaterialType
  content: string | null
  file_url: string | null
  file_size_bytes: number | null
  order_index: number
  created_at: string
}

export interface StudentProgress {
  id: string
  student_id: string
  course_id: string
  current_chapter_id: string | null
  chapters_completed: string[]
  progress_percentage: number
  last_watched_position_seconds: number
  last_accessed_at: string
  started_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
  // Relaciones
  course?: Course
  current_chapter?: Chapter
}

// ============================================================================
// COMUNIDAD - POSTS, COMENTARIOS, REACCIONES
// ============================================================================

export interface Post {
  id: string
  author_id: string
  content: string
  image_url: string | null
  is_pinned: boolean
  is_announcement: boolean
  reactions_count: number
  comments_count: number
  created_at: string
  updated_at: string
  // Relaciones
  author?: StudentPublicProfile
  comments?: Comment[]
  reactions?: Reaction[]
  user_reaction?: ReactionType | null
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_comment_id: string | null
  content: string
  reactions_count: number
  created_at: string
  updated_at: string
  // Relaciones
  author?: StudentPublicProfile
  replies?: Comment[]
}

export type ReactionType = 'like' | 'love' | 'celebrate' | 'insightful' | 'curious'
export type ReactionTarget = 'post' | 'comment'

export interface Reaction {
  id: string
  student_id: string
  target_type: ReactionTarget
  target_id: string
  type: ReactionType
  created_at: string
  // Relaciones
  student?: StudentPublicProfile
}

export type MentionSource = 'post' | 'comment'

export interface Mention {
  id: string
  source_type: MentionSource
  source_id: string
  mentioned_student_id: string
  mentioned_by_student_id: string
  is_read: boolean
  created_at: string
  // Relaciones
  mentioned_student?: StudentPublicProfile
  mentioned_by?: StudentPublicProfile
}

// ============================================================================
// SUSCRIPCIONES Y PAGOS
// ============================================================================

export type PaymentProvider = 'stripe' | 'culqi'
export type BillingCycle = 'monthly' | 'yearly'
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'canceled'

export interface Subscription {
  id: string
  student_id: string
  payment_provider: PaymentProvider
  external_subscription_id: string | null
  price_cents: number
  currency: string
  billing_cycle: BillingCycle
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  student_id: string
  subscription_id: string | null
  payment_provider: PaymentProvider
  external_payment_id: string | null
  amount_cents: number
  currency: string
  status: PaymentStatus
  payment_method: string | null
  payment_method_details: Record<string, unknown>
  metadata: Record<string, unknown>
  error_message: string | null
  created_at: string
  updated_at: string
}

export type PendingRegistrationStatus = 'pending' | 'completed' | 'expired' | 'failed'

export interface PendingRegistration {
  id: string
  email: string
  full_name: string
  plan: BillingCycle
  payment_provider: PaymentProvider
  checkout_session_id: string | null
  referral_code: string | null
  status: PendingRegistrationStatus
  expires_at: string
  completed_at: string | null
  created_at: string
}

// ============================================================================
// SISTEMA DE AFILIADOS
// ============================================================================

export interface Affiliate {
  id: string
  student_id: string
  referral_code: string
  paypal_email: string | null
  is_active: boolean
  total_earnings_cents: number
  pending_balance_cents: number
  paid_balance_cents: number
  referral_count: number
  active_referrals_count: number
  link_clicks: number
  conversion_rate: number
  created_at: string
  updated_at: string
  // Relaciones
  student?: Student
}

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled'

export interface AffiliateCommission {
  id: string
  affiliate_id: string
  referred_student_id: string
  payment_id: string | null
  subscription_amount_cents: number
  commission_cents: number
  commission_rate: number
  status: CommissionStatus
  paid_at: string | null
  payout_id: string | null
  created_at: string
  // Relaciones
  referred_student?: StudentPublicProfile
}

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type PayoutMethod = 'paypal' | 'bank_transfer' | 'stripe'

export interface AffiliatePayout {
  id: string
  affiliate_id: string
  amount_cents: number
  currency: string
  payment_method: PayoutMethod
  payment_details: Record<string, unknown>
  external_payout_id: string | null
  status: PayoutStatus
  processed_at: string | null
  failed_reason: string | null
  created_at: string
  updated_at: string
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
  device_type: string | null
  country: string | null
  created_at: string
}

// ============================================================================
// NOTIFICACIONES
// ============================================================================

export type NotificationType = 'comment' | 'reaction' | 'mention' | 'course' | 'subscription' | 'system' | 'achievement' | 'affiliate'

export interface Notification {
  id: string
  student_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  related_id: string | null
  related_type: string | null
  action_url: string | null
  created_at: string
}

export interface NotificationPreferences {
  id: string
  student_id: string
  email_comments: boolean
  email_reactions: boolean
  email_mentions: boolean
  email_course_updates: boolean
  email_subscription: boolean
  email_affiliate: boolean
  email_marketing: boolean
  push_enabled: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// SSO (Single Sign-On)
// ============================================================================

export interface SSOToken {
  id: string
  student_id: string
  token: string
  app_name: string
  expires_at: string
  is_used: boolean
  used_at: string | null
  external_user_id: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface SSOLoginRequest {
  email: string
  password: string
  app_name?: string
}

export interface SSOLoginResponse {
  success: boolean
  sso_token?: string
  expires_at?: string
  student?: {
    student_code: string
    full_name: string
    email: string
    subscription_status: SubscriptionStatus
  }
  error?: string
}

export interface SSOVerifyRequest {
  token: string
}

export interface SSOVerifyResponse {
  valid: boolean
  student?: {
    id: string
    student_code: string
    full_name: string
    email: string
    generated_email: string
    subscription_status: SubscriptionStatus
    avatar_url: string | null
  }
  error?: string
}

// ============================================================================
// ESTADÍSTICAS Y DASHBOARD
// ============================================================================

export interface DashboardStats {
  courses_in_progress: number
  courses_completed: number
  total_watch_time_minutes: number
  current_streak_days: number
  posts_count: number
  comments_count: number
}

export interface AffiliateStats {
  total_earnings_cents: number
  pending_balance_cents: number
  paid_balance_cents: number
  total_referrals: number
  active_referrals: number
  total_clicks: number
  conversion_rate: number
  this_month_earnings_cents: number
  this_month_referrals: number
}

export interface AdminStats {
  total_students: number
  active_subscribers: number
  monthly_revenue_cents: number
  total_courses: number
  total_posts: number
  new_students_this_month: number
  churn_rate: number
}

// ============================================================================
// FORMULARIOS
// ============================================================================

export interface RegisterFormData {
  full_name: string
  email: string
  plan: BillingCycle
  payment_provider: PaymentProvider
  referral_code?: string
}

export interface CompleteRegistrationFormData {
  session_id: string
  password: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface CreatePostFormData {
  content: string
  image_url?: string
}

export interface CreateCommentFormData {
  post_id: string
  content: string
  parent_comment_id?: string
}

export interface UpdateProgressFormData {
  course_id: string
  chapter_id: string
  completed?: boolean
  watch_position_seconds?: number
}

export interface PayoutRequestFormData {
  amount_cents: number
  payment_method: PayoutMethod
  paypal_email?: string
}

// ============================================================================
// RESPUESTAS API
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface CheckoutSessionResponse {
  checkout_url: string
  session_id: string
}

export interface RegistrationCompleteResponse {
  success: boolean
  student: {
    id: string
    student_code: string
    generated_email: string
    full_name: string
  }
  redirect_url: string
}

// ============================================================================
// CONSTANTES DE PRECIOS
// ============================================================================

export const PRICES = {
  USD: {
    monthly: 700, // $7.00
    yearly: 7000, // $70.00
  },
  PEN: {
    monthly: 2500, // S/25.00
    yearly: 25000, // S/250.00
  },
} as const

export const COMMISSION_RATE = 0.80 // 80%
export const MIN_PAYOUT_AMOUNT_CENTS = 1000 // $10.00
