-- ============================================================================
-- MIGRACIÓN: Video de Presentación para Cursos
-- Agrega campo para almacenar URL del video de presentación
-- ============================================================================

-- Agregar columna para video de presentación
ALTER TABLE courses ADD COLUMN IF NOT EXISTS presentation_video_url TEXT;

-- Comentario para documentar el campo
COMMENT ON COLUMN courses.presentation_video_url IS 'URL del video de presentación del curso (almacenado en Supabase Storage)';
