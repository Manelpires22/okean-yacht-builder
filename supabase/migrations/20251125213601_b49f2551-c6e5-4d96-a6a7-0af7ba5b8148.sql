-- Corrigir timestamps inconsistentes em customizações copiadas
-- Onde created_at > reviewed_at (situação logicamente impossível)
UPDATE quotation_customizations
SET created_at = reviewed_at
WHERE reviewed_at IS NOT NULL
  AND created_at > reviewed_at;