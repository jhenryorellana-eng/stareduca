-- ============================================================================
-- STAREDUCA - ROW LEVEL SECURITY POLICIES
-- Políticas de seguridad a nivel de fila
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: students
-- ============================================================================

-- Todos pueden ver perfiles públicos (info básica)
CREATE POLICY "Public student profiles are viewable by everyone"
  ON students FOR SELECT
  USING (true);

-- Estudiantes pueden actualizar su propio perfil
CREATE POLICY "Students can update own profile"
  ON students FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Admins pueden hacer todo
CREATE POLICY "Admins have full access to students"
  ON students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS: courses
-- ============================================================================

-- Cursos publicados son visibles para todos
CREATE POLICY "Published courses are viewable by everyone"
  ON courses FOR SELECT
  USING (is_published = true);

-- Admins e instructores pueden ver todos los cursos
CREATE POLICY "Admins and instructors can view all courses"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role IN ('admin', 'instructor')
    )
  );

-- Admins pueden gestionar cursos
CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- Instructores pueden gestionar sus propios cursos
CREATE POLICY "Instructors can manage own courses"
  ON courses FOR ALL
  USING (instructor_id::text = auth.uid()::text);

-- ============================================================================
-- POLÍTICAS: chapters
-- ============================================================================

-- Capítulos de preview gratuito son visibles para todos
CREATE POLICY "Free preview chapters are viewable by everyone"
  ON chapters FOR SELECT
  USING (
    is_free_preview = true
    AND EXISTS (SELECT 1 FROM courses WHERE id = chapters.course_id AND is_published = true)
  );

-- Suscriptores activos pueden ver todos los capítulos
CREATE POLICY "Active subscribers can view all chapters"
  ON chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text
      AND subscription_status = 'active'
    )
    AND EXISTS (SELECT 1 FROM courses WHERE id = chapters.course_id AND is_published = true)
  );

-- Admins pueden gestionar capítulos
CREATE POLICY "Admins can manage chapters"
  ON chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS: chapter_materials
-- ============================================================================

-- Suscriptores activos pueden ver materiales
CREATE POLICY "Active subscribers can view chapter materials"
  ON chapter_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text
      AND subscription_status = 'active'
    )
  );

-- Admins pueden gestionar materiales
CREATE POLICY "Admins can manage chapter materials"
  ON chapter_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS: student_progress
-- ============================================================================

-- Estudiantes pueden ver y gestionar su propio progreso
CREATE POLICY "Students can manage own progress"
  ON student_progress FOR ALL
  USING (student_id::text = auth.uid()::text)
  WITH CHECK (student_id::text = auth.uid()::text);

-- Admins pueden ver todo el progreso
CREATE POLICY "Admins can view all progress"
  ON student_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS: posts
-- ============================================================================

-- Usuarios autenticados pueden ver posts
CREATE POLICY "Authenticated users can view posts"
  ON posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Usuarios autenticados pueden crear posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id::text = auth.uid()::text
  );

-- Autores pueden actualizar sus propios posts
CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE
  USING (author_id::text = auth.uid()::text)
  WITH CHECK (author_id::text = auth.uid()::text);

-- Autores pueden eliminar sus propios posts
CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE
  USING (author_id::text = auth.uid()::text);

-- Admins pueden gestionar todos los posts
CREATE POLICY "Admins can manage all posts"
  ON posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS: comments
-- ============================================================================

-- Usuarios autenticados pueden ver comentarios
CREATE POLICY "Authenticated users can view comments"
  ON comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Usuarios autenticados pueden crear comentarios
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id::text = auth.uid()::text
  );

-- Autores pueden actualizar sus comentarios
CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE
  USING (author_id::text = auth.uid()::text);

-- Autores pueden eliminar sus comentarios
CREATE POLICY "Authors can delete own comments"
  ON comments FOR DELETE
  USING (author_id::text = auth.uid()::text);

-- ============================================================================
-- POLÍTICAS: reactions
-- ============================================================================

-- Usuarios autenticados pueden ver reacciones
CREATE POLICY "Authenticated users can view reactions"
  ON reactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Usuarios pueden gestionar sus propias reacciones
CREATE POLICY "Users can manage own reactions"
  ON reactions FOR ALL
  USING (student_id::text = auth.uid()::text)
  WITH CHECK (student_id::text = auth.uid()::text);

-- ============================================================================
-- POLÍTICAS: mentions
-- ============================================================================

-- Usuarios pueden ver menciones donde son mencionados
CREATE POLICY "Users can view mentions where they are mentioned"
  ON mentions FOR SELECT
  USING (
    mentioned_student_id::text = auth.uid()::text
    OR mentioned_by_student_id::text = auth.uid()::text
  );

-- Usuarios pueden crear menciones
CREATE POLICY "Users can create mentions"
  ON mentions FOR INSERT
  WITH CHECK (mentioned_by_student_id::text = auth.uid()::text);

-- ============================================================================
-- POLÍTICAS: subscriptions
-- ============================================================================

-- Usuarios pueden ver sus propias suscripciones
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (student_id::text = auth.uid()::text);

-- Admins pueden ver todas las suscripciones
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS: payments
-- ============================================================================

-- Usuarios pueden ver sus propios pagos
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (student_id::text = auth.uid()::text);

-- Admins pueden ver todos los pagos
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS: pending_registrations (solo service role)
-- ============================================================================

-- Solo service role puede acceder (operaciones de servidor)
CREATE POLICY "Service role only for pending registrations"
  ON pending_registrations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- POLÍTICAS: affiliates
-- ============================================================================

-- Perfiles de afiliados son públicos (para landing pages)
CREATE POLICY "Affiliate profiles are public"
  ON affiliates FOR SELECT
  USING (true);

-- Usuarios pueden gestionar su propio perfil de afiliado
CREATE POLICY "Users can manage own affiliate profile"
  ON affiliates FOR ALL
  USING (student_id::text = auth.uid()::text)
  WITH CHECK (student_id::text = auth.uid()::text);

-- ============================================================================
-- POLÍTICAS: affiliate_commissions
-- ============================================================================

-- Afiliados pueden ver sus propias comisiones
CREATE POLICY "Affiliates can view own commissions"
  ON affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE id = affiliate_commissions.affiliate_id
      AND student_id::text = auth.uid()::text
    )
  );

-- Admins pueden ver todas las comisiones
CREATE POLICY "Admins can view all commissions"
  ON affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- ============================================================================
-- POLÍTICAS: affiliate_payouts
-- ============================================================================

-- Afiliados pueden ver sus propios payouts
CREATE POLICY "Affiliates can view own payouts"
  ON affiliate_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE id = affiliate_payouts.affiliate_id
      AND student_id::text = auth.uid()::text
    )
  );

-- Afiliados pueden crear solicitudes de payout
CREATE POLICY "Affiliates can create payout requests"
  ON affiliate_payouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE id = affiliate_payouts.affiliate_id
      AND student_id::text = auth.uid()::text
    )
  );

-- ============================================================================
-- POLÍTICAS: affiliate_link_clicks
-- ============================================================================

-- Afiliados pueden ver clicks de sus propios links
CREATE POLICY "Affiliates can view own link clicks"
  ON affiliate_link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE id = affiliate_link_clicks.affiliate_id
      AND student_id::text = auth.uid()::text
    )
  );

-- Cualquiera puede insertar clicks (tracking público)
CREATE POLICY "Anyone can insert link clicks"
  ON affiliate_link_clicks FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- POLÍTICAS: notifications
-- ============================================================================

-- Usuarios pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (student_id::text = auth.uid()::text);

-- Usuarios pueden actualizar sus propias notificaciones (marcar como leídas)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (student_id::text = auth.uid()::text);

-- ============================================================================
-- POLÍTICAS: sso_tokens
-- ============================================================================

-- Usuarios pueden ver sus propios tokens SSO
CREATE POLICY "Users can view own SSO tokens"
  ON sso_tokens FOR SELECT
  USING (student_id::text = auth.uid()::text);

-- ============================================================================
-- POLÍTICAS: notification_preferences
-- ============================================================================

-- Usuarios pueden gestionar sus propias preferencias
CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (student_id::text = auth.uid()::text)
  WITH CHECK (student_id::text = auth.uid()::text);
