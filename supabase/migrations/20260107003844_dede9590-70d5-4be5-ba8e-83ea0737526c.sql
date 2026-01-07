-- =============================================
-- FASE 2: Remover Índices Duplicados
-- =============================================

-- ato_workflow_steps - manter idx_ato_steps_*, remover duplicados
DROP INDEX IF EXISTS idx_ato_workflow_steps_status;
DROP INDEX IF EXISTS idx_ato_workflow_steps_assigned_to;
DROP INDEX IF EXISTS idx_ato_workflow_steps_ato_id;

-- contracts - remover idx duplicado de constraint
DROP INDEX IF EXISTS idx_contracts_contract_number;

-- quotation_customizations - remover idx duplicado
DROP INDEX IF EXISTS idx_customizations_workflow_status;

-- quotations - remover idx duplicado de constraint
DROP INDEX IF EXISTS idx_quotations_secure_token;

-- workflow_settings - remover idx duplicado de constraint  
DROP INDEX IF EXISTS idx_workflow_settings_key;

-- customization_workflow_steps - manter idx_customization_*, remover duplicados
DROP INDEX IF EXISTS idx_workflow_steps_status;

-- =============================================
-- FASE 3: Remover Índices Não Utilizados
-- =============================================

-- Índices de audit_logs nunca usados
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_table_name;

-- Índices de configuração não usados
DROP INDEX IF EXISTS idx_hull_numbers_yacht_model;
DROP INDEX IF EXISTS idx_options_configurable;
DROP INDEX IF EXISTS idx_yacht_models_registration;
DROP INDEX IF EXISTS idx_yacht_models_delivery_date;
DROP INDEX IF EXISTS idx_yacht_models_model;
DROP INDEX IF EXISTS idx_yacht_models_is_active;

-- Índices de workflow não usados
DROP INDEX IF EXISTS idx_ato_steps_status;
DROP INDEX IF EXISTS idx_quotation_customizations_included_in_contract;
DROP INDEX IF EXISTS idx_customizations_pending;
DROP INDEX IF EXISTS idx_customizations_reviewed_at;

-- Índices de PDF não usados
DROP INDEX IF EXISTS idx_pdf_templates_status;
DROP INDEX IF EXISTS idx_pdf_templates_document_type;

-- Índices de aprovações backup não usados
DROP INDEX IF EXISTS idx_approvals_backup_reviewed_by;
DROP INDEX IF EXISTS idx_approvals_backup_requested_by;

-- Índices de cotações não usados
DROP INDEX IF EXISTS idx_quotations_client_id;
DROP INDEX IF EXISTS idx_quotations_created_at;

-- Índices de memorial não usados
DROP INDEX IF EXISTS idx_memorial_items_configurable;

-- =============================================
-- FASE 4: Adicionar NOT NULL com Defaults
-- =============================================

-- Primeiro garantir que não há nulls antes de adicionar constraint
UPDATE additional_to_orders SET created_at = now() WHERE created_at IS NULL;
UPDATE contracts SET created_at = now() WHERE created_at IS NULL;
UPDATE quotations SET created_at = now() WHERE created_at IS NULL;
UPDATE job_stops SET is_active = true WHERE is_active IS NULL;
UPDATE memorial_categories SET is_active = true WHERE is_active IS NULL;
UPDATE memorial_items SET is_active = true WHERE is_active IS NULL;
UPDATE options SET is_active = true WHERE is_active IS NULL;

-- Adicionar defaults e NOT NULL
ALTER TABLE additional_to_orders 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE contracts 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE job_stops ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE memorial_categories ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE memorial_items ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE options ALTER COLUMN is_active SET DEFAULT true;