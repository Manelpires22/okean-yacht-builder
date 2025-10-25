-- Fase 1: Novos status, snapshot, versionamento e link de aceite

-- 1. Atualizar constraint de status com novos valores
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;

ALTER TABLE quotations ADD CONSTRAINT quotations_status_check
CHECK (status IN (
  'draft',
  'pending_commercial_approval',
  'pending_technical_approval',
  'ready_to_send',
  'sent',
  'accepted',
  'rejected',
  'expired'
));

-- 2. Adicionar campos de snapshot e versionamento
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS snapshot_json JSONB;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS parent_quotation_id UUID REFERENCES quotations(id);

-- 3. Adicionar campos para aceite público
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS secure_token UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS accepted_by_name TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS accepted_by_email TEXT;

-- 4. Adicionar índice para busca por token
CREATE INDEX IF NOT EXISTS idx_quotations_secure_token ON quotations(secure_token);

-- 5. Adicionar campos detalhados às customizações
ALTER TABLE quotation_customizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE quotation_customizations ADD COLUMN IF NOT EXISTS additional_cost NUMERIC DEFAULT 0;
ALTER TABLE quotation_customizations ADD COLUMN IF NOT EXISTS delivery_impact_days INTEGER DEFAULT 0;
ALTER TABLE quotation_customizations ADD COLUMN IF NOT EXISTS engineering_notes TEXT;
ALTER TABLE quotation_customizations ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE quotation_customizations ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 6. Adicionar constraint de status para customizações
ALTER TABLE quotation_customizations DROP CONSTRAINT IF EXISTS customizations_status_check;
ALTER TABLE quotation_customizations ADD CONSTRAINT customizations_status_check
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 7. Comentários para documentação
COMMENT ON COLUMN quotations.snapshot_json IS 'Snapshot congelado da cotação no momento do envio (preços, config, opcionais)';
COMMENT ON COLUMN quotations.version IS 'Versão da cotação (incrementa a cada revisão)';
COMMENT ON COLUMN quotations.parent_quotation_id IS 'Referência à cotação pai (se for uma revisão)';
COMMENT ON COLUMN quotations.secure_token IS 'Token único para link público de aceite';
COMMENT ON COLUMN quotation_customizations.status IS 'Status da validação técnica: pending, approved, rejected';
COMMENT ON COLUMN quotation_customizations.additional_cost IS 'Custo adicional validado pela engenharia';
COMMENT ON COLUMN quotation_customizations.delivery_impact_days IS 'Impacto no prazo de entrega em dias';