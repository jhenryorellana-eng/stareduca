-- ============================================================================
-- STAREDUCA - SCHEMA INICIAL
-- Plataforma educativa con cursos, comunidad y sistema de afiliados
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. TABLA: students (Usuarios/Estudiantes)
-- ============================================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  generated_email TEXT UNIQUE,
  student_code TEXT UNIQUE,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  culqi_customer_id TEXT UNIQUE,
  referred_by_student_id UUID REFERENCES students(id),
  is_email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_student_code ON students(student_code);
CREATE INDEX idx_students_generated_email ON students(generated_email);
CREATE INDEX idx_students_subscription ON students(subscription_status);
CREATE INDEX idx_students_referred_by ON students(referred_by_student_id);
CREATE INDEX idx_students_role ON students(role);

-- ============================================================================
-- 2. TABLA: courses (Cursos)
-- ============================================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  instructor_id UUID REFERENCES students(id),
  instructor_name TEXT,
  total_chapters INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_featured ON courses(is_featured);
CREATE INDEX idx_courses_category ON courses(category);

-- ============================================================================
-- 3. TABLA: chapters (Capítulos de cursos)
-- ============================================================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_html TEXT,
  video_url TEXT,
  video_duration_seconds INTEGER DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, chapter_number)
);

CREATE INDEX idx_chapters_course ON chapters(course_id);
CREATE INDEX idx_chapters_order ON chapters(course_id, order_index);

-- ============================================================================
-- 4. TABLA: chapter_materials (Materiales complementarios)
-- ============================================================================
CREATE TABLE chapter_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'link', 'text', 'download', 'video')),
  content TEXT,
  file_url TEXT,
  file_size_bytes INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chapter_materials_chapter ON chapter_materials(chapter_id);

-- ============================================================================
-- 5. TABLA: student_progress (Progreso del estudiante)
-- ============================================================================
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  current_chapter_id UUID REFERENCES chapters(id),
  chapters_completed UUID[] DEFAULT '{}',
  progress_percentage INTEGER DEFAULT 0,
  last_watched_position_seconds INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_course ON student_progress(course_id);

-- ============================================================================
-- 6. TABLA: posts (Publicaciones de comunidad)
-- ============================================================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 10000),
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_announcement BOOLEAN DEFAULT false,
  reactions_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_pinned ON posts(is_pinned, created_at DESC);

-- ============================================================================
-- 7. TABLA: comments (Comentarios en posts)
-- ============================================================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  reactions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- ============================================================================
-- 8. TABLA: reactions (Reacciones a posts/comentarios)
-- ============================================================================
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'love', 'celebrate', 'insightful', 'curious')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, target_type, target_id)
);

CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_student ON reactions(student_id);

-- ============================================================================
-- 9. TABLA: mentions (Menciones @usuario)
-- ============================================================================
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN ('post', 'comment')),
  source_id UUID NOT NULL,
  mentioned_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mentioned_by_student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id, mentioned_student_id)
);

CREATE INDEX idx_mentions_mentioned ON mentions(mentioned_student_id, created_at DESC);
CREATE INDEX idx_mentions_source ON mentions(source_type, source_id);

-- ============================================================================
-- 10. TABLA: subscriptions (Historial de suscripciones)
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'culqi')),
  external_subscription_id TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'expired', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_external ON subscriptions(external_subscription_id);

-- ============================================================================
-- 11. TABLA: payments (Pagos individuales)
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'culqi')),
  external_payment_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')),
  payment_method TEXT,
  payment_method_details JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external ON payments(external_payment_id);

-- ============================================================================
-- 12. TABLA: pending_registrations (Registros pendientes de pago)
-- ============================================================================
CREATE TABLE pending_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'culqi')),
  checkout_session_id TEXT,
  referral_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'failed')),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pending_registrations_email ON pending_registrations(email);
CREATE INDEX idx_pending_registrations_session ON pending_registrations(checkout_session_id);
CREATE INDEX idx_pending_registrations_status ON pending_registrations(status);

-- ============================================================================
-- 13. TABLA: affiliates (Sistema de afiliados)
-- ============================================================================
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  paypal_email TEXT,
  is_active BOOLEAN DEFAULT false,
  total_earnings_cents INTEGER DEFAULT 0,
  pending_balance_cents INTEGER DEFAULT 0,
  paid_balance_cents INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  active_referrals_count INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliates_student ON affiliates(student_id);
CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX idx_affiliates_is_active ON affiliates(is_active);

-- ============================================================================
-- 14. TABLA: affiliate_commissions (Comisiones de afiliados)
-- ============================================================================
CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_student_id UUID NOT NULL REFERENCES students(id),
  payment_id UUID REFERENCES payments(id),
  subscription_amount_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL,
  commission_rate DECIMAL(3,2) DEFAULT 0.80,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  payout_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX idx_affiliate_commissions_referred ON affiliate_commissions(referred_student_id);

-- ============================================================================
-- 15. TABLA: affiliate_payouts (Pagos a afiliados)
-- ============================================================================
CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paypal', 'bank_transfer', 'stripe')),
  payment_details JSONB DEFAULT '{}',
  external_payout_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processed_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON affiliate_payouts(status);

-- ============================================================================
-- 16. TABLA: affiliate_link_clicks (Clicks en links de afiliados)
-- ============================================================================
CREATE TABLE affiliate_link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_link_clicks_affiliate ON affiliate_link_clicks(affiliate_id);
CREATE INDEX idx_affiliate_link_clicks_created ON affiliate_link_clicks(created_at DESC);

-- ============================================================================
-- 17. TABLA: notifications (Notificaciones)
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reaction', 'mention', 'course', 'subscription', 'system', 'achievement', 'affiliate')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  related_type TEXT,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_student ON notifications(student_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================================================
-- 18. TABLA: sso_tokens (Tokens SSO para Starbooks)
-- ============================================================================
CREATE TABLE sso_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  app_name TEXT DEFAULT 'starbooks',
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  external_user_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sso_tokens_token ON sso_tokens(token);
CREATE INDEX idx_sso_tokens_student ON sso_tokens(student_id);
CREATE INDEX idx_sso_tokens_expires ON sso_tokens(expires_at);

-- ============================================================================
-- 19. TABLA: notification_preferences (Preferencias de notificaciones)
-- ============================================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  email_comments BOOLEAN DEFAULT true,
  email_reactions BOOLEAN DEFAULT true,
  email_mentions BOOLEAN DEFAULT true,
  email_course_updates BOOLEAN DEFAULT true,
  email_subscription BOOLEAN DEFAULT true,
  email_affiliate BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_student ON notification_preferences(student_id);
