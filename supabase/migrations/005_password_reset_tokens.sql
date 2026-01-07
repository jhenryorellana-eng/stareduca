-- ============================================================================
-- MIGRATION 005: Password Reset Tokens
-- Tabla para almacenar tokens de recuperacion de contrasena
-- ============================================================================

-- Crear tabla de tokens de reset
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_student ON password_reset_tokens(student_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Funcion para limpiar tokens expirados (opcional, ejecutar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- RLS: Solo el service role puede acceder a esta tabla
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- No hay politicas para usuarios normales, solo acceso via service role
