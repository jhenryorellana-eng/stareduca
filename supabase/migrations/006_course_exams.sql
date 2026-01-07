-- ============================================================================
-- STAREDUCA - SISTEMA DE EXAMENES DE CURSOS
-- Migracion 006: Tablas para examenes finales de cursos
-- ============================================================================

-- ============================================================================
-- 1. TABLA: course_exams (Configuracion del examen por curso)
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID UNIQUE NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Examen Final',
  description TEXT,
  passing_percentage INTEGER NOT NULL DEFAULT 70 CHECK (passing_percentage >= 0 AND passing_percentage <= 100),
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_exams_course ON course_exams(course_id);
CREATE INDEX IF NOT EXISTS idx_course_exams_enabled ON course_exams(is_enabled);

-- ============================================================================
-- 2. TABLA: exam_questions (Preguntas del examen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES course_exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_option_index INTEGER NOT NULL CHECK (correct_option_index >= 0 AND correct_option_index <= 3),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(exam_id, order_index);

-- ============================================================================
-- 3. TABLA: exam_attempts (Intentos de examen por estudiante)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES course_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_passed ON exam_attempts(passed);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_exam ON exam_attempts(student_id, exam_id);

-- ============================================================================
-- 4. TRIGGERS para updated_at
-- ============================================================================

-- Trigger para actualizar updated_at en course_exams
CREATE OR REPLACE FUNCTION update_course_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_course_exams_updated_at ON course_exams;
CREATE TRIGGER trigger_course_exams_updated_at
  BEFORE UPDATE ON course_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_course_exams_updated_at();

-- Trigger para actualizar updated_at en exam_questions
DROP TRIGGER IF EXISTS trigger_exam_questions_updated_at ON exam_questions;
CREATE TRIGGER trigger_exam_questions_updated_at
  BEFORE UPDATE ON exam_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_course_exams_updated_at();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE course_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Policies para course_exams
DROP POLICY IF EXISTS "Estudiantes pueden ver examenes habilitados" ON course_exams;
CREATE POLICY "Estudiantes pueden ver examenes habilitados"
  ON course_exams FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Policies para exam_questions
DROP POLICY IF EXISTS "Estudiantes pueden ver preguntas de examenes habilitados" ON exam_questions;
CREATE POLICY "Estudiantes pueden ver preguntas de examenes habilitados"
  ON exam_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_exams
      WHERE course_exams.id = exam_questions.exam_id
      AND course_exams.is_enabled = true
    )
  );

-- Policies para exam_attempts
DROP POLICY IF EXISTS "Estudiantes pueden ver sus propios intentos" ON exam_attempts;
CREATE POLICY "Estudiantes pueden ver sus propios intentos"
  ON exam_attempts FOR SELECT
  TO authenticated
  USING (student_id = (auth.jwt() -> 'user_metadata' ->> 'student_id')::UUID);

DROP POLICY IF EXISTS "Estudiantes pueden crear sus propios intentos" ON exam_attempts;
CREATE POLICY "Estudiantes pueden crear sus propios intentos"
  ON exam_attempts FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (auth.jwt() -> 'user_metadata' ->> 'student_id')::UUID);

DROP POLICY IF EXISTS "Estudiantes pueden actualizar sus propios intentos" ON exam_attempts;
CREATE POLICY "Estudiantes pueden actualizar sus propios intentos"
  ON exam_attempts FOR UPDATE
  TO authenticated
  USING (student_id = (auth.jwt() -> 'user_metadata' ->> 'student_id')::UUID);
