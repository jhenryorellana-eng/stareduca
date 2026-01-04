-- ============================================================================
-- MIGRACIÓN 004: Campos de Padre e Hijo para Registro
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- Agregar campos a pending_registrations (datos temporales durante registro)
ALTER TABLE pending_registrations
ADD COLUMN IF NOT EXISTS parent_first_name TEXT,
ADD COLUMN IF NOT EXISTS parent_last_name TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS parent_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS child_first_name TEXT,
ADD COLUMN IF NOT EXISTS child_last_name TEXT,
ADD COLUMN IF NOT EXISTS child_age INTEGER,
ADD COLUMN IF NOT EXISTS child_city TEXT,
ADD COLUMN IF NOT EXISTS child_country TEXT;

-- Agregar campos a students (datos permanentes del estudiante)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS parent_first_name TEXT,
ADD COLUMN IF NOT EXISTS parent_last_name TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS parent_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS child_first_name TEXT,
ADD COLUMN IF NOT EXISTS child_last_name TEXT,
ADD COLUMN IF NOT EXISTS child_age INTEGER,
ADD COLUMN IF NOT EXISTS child_city TEXT,
ADD COLUMN IF NOT EXISTS child_country TEXT;

-- Comentarios descriptivos
COMMENT ON COLUMN pending_registrations.parent_first_name IS 'Nombres del padre/tutor';
COMMENT ON COLUMN pending_registrations.parent_last_name IS 'Apellidos del padre/tutor';
COMMENT ON COLUMN pending_registrations.parent_email IS 'Email del padre/tutor';
COMMENT ON COLUMN pending_registrations.parent_whatsapp IS 'WhatsApp del padre/tutor';
COMMENT ON COLUMN pending_registrations.child_first_name IS 'Nombres del hijo/estudiante';
COMMENT ON COLUMN pending_registrations.child_last_name IS 'Apellidos del hijo/estudiante';
COMMENT ON COLUMN pending_registrations.child_age IS 'Edad del hijo/estudiante';
COMMENT ON COLUMN pending_registrations.child_city IS 'Ciudad donde vive el hijo';
COMMENT ON COLUMN pending_registrations.child_country IS 'País donde vive el hijo';

COMMENT ON COLUMN students.parent_first_name IS 'Nombres del padre/tutor';
COMMENT ON COLUMN students.parent_last_name IS 'Apellidos del padre/tutor';
COMMENT ON COLUMN students.parent_email IS 'Email del padre/tutor';
COMMENT ON COLUMN students.parent_whatsapp IS 'WhatsApp del padre/tutor';
COMMENT ON COLUMN students.child_first_name IS 'Nombres del hijo/estudiante';
COMMENT ON COLUMN students.child_last_name IS 'Apellidos del hijo/estudiante';
COMMENT ON COLUMN students.child_age IS 'Edad del hijo/estudiante';
COMMENT ON COLUMN students.child_city IS 'Ciudad donde vive el hijo';
COMMENT ON COLUMN students.child_country IS 'País donde vive el hijo';
