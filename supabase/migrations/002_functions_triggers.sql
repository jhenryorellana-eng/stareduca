-- ============================================================================
-- STAREDUCA - FUNCIONES Y TRIGGERS
-- Generación de códigos, emails automáticos y triggers
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: Generar código de estudiante único
-- Formato: XXX-YYYYYY (3 letras aleatorias + 6 números aleatorios)
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS TEXT AS $$
DECLARE
  letters TEXT;
  numbers TEXT;
  new_code TEXT;
  code_exists BOOLEAN;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    attempt := attempt + 1;

    -- Evitar loop infinito
    IF attempt > max_attempts THEN
      RAISE EXCEPTION 'No se pudo generar código único después de % intentos', max_attempts;
    END IF;

    -- Generar 3 letras aleatorias
    letters := '';
    FOR i IN 1..3 LOOP
      letters := letters || SUBSTRING(chars FROM FLOOR(RANDOM() * 26 + 1)::INT FOR 1);
    END LOOP;

    -- Generar 6 números aleatorios
    numbers := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    new_code := letters || '-' || numbers;

    -- Verificar unicidad
    SELECT EXISTS(SELECT 1 FROM students WHERE student_code = new_code) INTO code_exists;

    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: Generar email automático basado en código de estudiante
-- Formato: abc123456@starbizacademy.com
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_student_email(p_student_code TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convertir código a minúsculas y remover guión
  -- Ejemplo: ABC-123456 -> abc123456@starbizacademy.com
  RETURN LOWER(REPLACE(p_student_code, '-', '')) || '@starbizacademy.com';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: Generar código de referido único para afiliados
-- Formato: 8 caracteres alfanuméricos en minúsculas
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    attempt := attempt + 1;

    IF attempt > max_attempts THEN
      RAISE EXCEPTION 'No se pudo generar código de referido único después de % intentos', max_attempts;
    END IF;

    -- Generar 8 caracteres alfanuméricos
    new_code := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));

    SELECT EXISTS(SELECT 1 FROM affiliates WHERE referral_code = new_code) INTO code_exists;

    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-generar código y email al crear estudiante
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_generate_student_codes()
RETURNS TRIGGER AS $$
BEGIN
  -- Generar código de estudiante si no existe
  IF NEW.student_code IS NULL THEN
    NEW.student_code := generate_student_code();
  END IF;

  -- Generar email automático si no existe
  IF NEW.generated_email IS NULL AND NEW.student_code IS NOT NULL THEN
    NEW.generated_email := generate_student_email(NEW.student_code);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_student_codes
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_student_codes();

-- ============================================================================
-- TRIGGER: Auto-generar código de referido al crear afiliado
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_affiliate_referral_code
  BEFORE INSERT ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_referral_code();

-- ============================================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER update_students_timestamp
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_courses_timestamp
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_chapters_timestamp
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_student_progress_timestamp
  BEFORE UPDATE ON student_progress
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_posts_timestamp
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_comments_timestamp
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_subscriptions_timestamp
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_payments_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_affiliates_timestamp
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_affiliate_payouts_timestamp
  BEFORE UPDATE ON affiliate_payouts
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

-- ============================================================================
-- TRIGGER: Actualizar contadores de reacciones en posts
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_update_post_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE posts SET reactions_count = reactions_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE posts SET reactions_count = GREATEST(0, reactions_count - 1) WHERE id = OLD.target_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_reactions_count
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_post_reactions_count();

-- ============================================================================
-- TRIGGER: Actualizar contadores de comentarios en posts
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION trigger_update_post_comments_count();

-- ============================================================================
-- TRIGGER: Actualizar total_chapters en cursos
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_update_course_chapters_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses
    SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE course_id = NEW.course_id)
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses
    SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE course_id = OLD.course_id)
    WHERE id = OLD.course_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_chapters_count
  AFTER INSERT OR DELETE ON chapters
  FOR EACH ROW EXECUTE FUNCTION trigger_update_course_chapters_count();

-- ============================================================================
-- TRIGGER: Crear preferencias de notificación al crear estudiante
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (student_id)
  VALUES (NEW.id)
  ON CONFLICT (student_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_preferences_after_student
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION trigger_create_notification_preferences();

-- ============================================================================
-- FUNCIÓN: Calcular progreso del estudiante en un curso
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_student_id UUID,
  p_course_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  total_chapters INTEGER;
  completed_chapters INTEGER;
  progress INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_chapters FROM chapters WHERE course_id = p_course_id;

  IF total_chapters = 0 THEN
    RETURN 0;
  END IF;

  SELECT array_length(chapters_completed, 1) INTO completed_chapters
  FROM student_progress
  WHERE student_id = p_student_id AND course_id = p_course_id;

  IF completed_chapters IS NULL THEN
    completed_chapters := 0;
  END IF;

  progress := ROUND((completed_chapters::DECIMAL / total_chapters) * 100);

  RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: Procesar comisión de afiliado
-- ============================================================================
CREATE OR REPLACE FUNCTION process_affiliate_commission(
  p_referral_code TEXT,
  p_referred_student_id UUID,
  p_payment_id UUID,
  p_amount_cents INTEGER,
  p_commission_rate DECIMAL DEFAULT 0.80
)
RETURNS UUID AS $$
DECLARE
  v_affiliate_id UUID;
  v_commission_cents INTEGER;
  v_commission_id UUID;
BEGIN
  -- Encontrar el afiliado por código de referido
  SELECT id INTO v_affiliate_id
  FROM affiliates
  WHERE referral_code = p_referral_code AND is_active = true;

  IF v_affiliate_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calcular comisión
  v_commission_cents := ROUND(p_amount_cents * p_commission_rate);

  -- Crear registro de comisión
  INSERT INTO affiliate_commissions (
    affiliate_id,
    referred_student_id,
    payment_id,
    subscription_amount_cents,
    commission_cents,
    commission_rate,
    status
  ) VALUES (
    v_affiliate_id,
    p_referred_student_id,
    p_payment_id,
    p_amount_cents,
    v_commission_cents,
    p_commission_rate,
    'pending'
  ) RETURNING id INTO v_commission_id;

  -- Actualizar balances del afiliado
  UPDATE affiliates
  SET
    total_earnings_cents = total_earnings_cents + v_commission_cents,
    pending_balance_cents = pending_balance_cents + v_commission_cents,
    referral_count = referral_count + 1
  WHERE id = v_affiliate_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: Incrementar clicks de link de afiliado
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_affiliate_link_clicks(p_affiliate_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliates
  SET link_clicks = link_clicks + 1
  WHERE id = p_affiliate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: Procesar payout completado
-- ============================================================================
CREATE OR REPLACE FUNCTION process_payout_completion(
  p_payout_id UUID,
  p_status TEXT
)
RETURNS VOID AS $$
DECLARE
  v_affiliate_id UUID;
  v_amount_cents INTEGER;
BEGIN
  SELECT affiliate_id, amount_cents INTO v_affiliate_id, v_amount_cents
  FROM affiliate_payouts
  WHERE id = p_payout_id;

  IF p_status = 'completed' THEN
    -- Actualizar payout
    UPDATE affiliate_payouts
    SET status = 'completed', processed_at = NOW()
    WHERE id = p_payout_id;

    -- Actualizar balances del afiliado
    UPDATE affiliates
    SET
      pending_balance_cents = pending_balance_cents - v_amount_cents,
      paid_balance_cents = paid_balance_cents + v_amount_cents
    WHERE id = v_affiliate_id;

    -- Marcar comisiones como pagadas
    UPDATE affiliate_commissions
    SET status = 'paid', paid_at = NOW(), payout_id = p_payout_id
    WHERE affiliate_id = v_affiliate_id AND status = 'approved';

  ELSIF p_status = 'failed' THEN
    UPDATE affiliate_payouts
    SET status = 'failed', processed_at = NOW()
    WHERE id = p_payout_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
