-- Tabela para armazenar códigos de recuperação MFA
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: apenas o próprio usuário pode ver seus códigos
CREATE POLICY "Users can view their own recovery codes"
  ON mfa_recovery_codes FOR SELECT
  USING (user_id = auth.uid());

-- Apenas o sistema pode criar códigos (via edge function)
CREATE POLICY "System can create recovery codes"
  ON mfa_recovery_codes FOR INSERT
  WITH CHECK (true);

-- Usuário pode usar (update used_at) seus próprios códigos
CREATE POLICY "Users can use their own recovery codes"
  ON mfa_recovery_codes FOR UPDATE
  USING (user_id = auth.uid());

-- Admins podem deletar códigos (para reset)
CREATE POLICY "Admins can delete recovery codes"
  ON mfa_recovery_codes FOR DELETE
  USING (has_role(auth.uid(), 'administrador'::app_role));

-- Índice para busca rápida por user
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user ON mfa_recovery_codes(user_id);