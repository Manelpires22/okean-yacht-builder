-- =====================================================
-- PERFORMANCE INDEXES - Sprint 3 (Corrigido)
-- Adiciona apenas índices que ainda não existem
-- =====================================================

-- 1. QUOTATIONS - Índices faltantes
-- Índice para filtrar por vendedor
CREATE INDEX IF NOT EXISTS idx_quotations_sales_rep 
  ON quotations(sales_representative_id);

-- Índice para filtrar por modelo de iate
CREATE INDEX IF NOT EXISTS idx_quotations_yacht_model 
  ON quotations(yacht_model_id);

-- Índice composto para listagem por status ordenada por data
CREATE INDEX IF NOT EXISTS idx_quotations_status_created 
  ON quotations(status, created_at DESC);

-- 2. QUOTATION_OPTIONS - JOINs frequentes
CREATE INDEX IF NOT EXISTS idx_quotation_options_quotation 
  ON quotation_options(quotation_id);

CREATE INDEX IF NOT EXISTS idx_quotation_options_option 
  ON quotation_options(option_id);

-- 3. QUOTATION_CUSTOMIZATIONS - Tarefas pendentes
-- Índice parcial para queries de workflow pendente
CREATE INDEX IF NOT EXISTS idx_customizations_pending 
  ON quotation_customizations(workflow_status, quotation_id) 
  WHERE workflow_status IN ('pending_pm_review', 'pending_commercial_review');

-- 4. CUSTOMIZATION_WORKFLOW_STEPS - Timeline ordenada
CREATE INDEX IF NOT EXISTS idx_customization_steps_created 
  ON customization_workflow_steps(created_at DESC);

-- 5. OPTIONS - Filtro por categoria
CREATE INDEX IF NOT EXISTS idx_options_category 
  ON options(category_id) 
  WHERE category_id IS NOT NULL;

-- 6. AUDIT_LOGS - Busca por entidade (corrigido para colunas reais)
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record 
  ON audit_logs(table_name, record_id);

-- =====================================================
-- COMENTÁRIOS SOBRE OS ÍNDICES
-- =====================================================
COMMENT ON INDEX idx_quotations_sales_rep IS 
  'Otimiza filtros de cotações por vendedor responsável';

COMMENT ON INDEX idx_quotations_yacht_model IS 
  'Otimiza filtros de cotações por modelo de iate';

COMMENT ON INDEX idx_quotations_status_created IS 
  'Otimiza listagem de cotações por status ordenadas por data';

COMMENT ON INDEX idx_quotation_options_quotation IS 
  'Otimiza JOINs entre quotation_options e quotations';

COMMENT ON INDEX idx_quotation_options_option IS 
  'Otimiza JOINs entre quotation_options e options';

COMMENT ON INDEX idx_customizations_pending IS 
  'Otimiza queries de tarefas pendentes no workflow de customizações';

COMMENT ON INDEX idx_customization_steps_created IS 
  'Otimiza timeline de workflow ordenada por data';

COMMENT ON INDEX idx_options_category IS 
  'Otimiza filtros de opcionais por categoria';

COMMENT ON INDEX idx_audit_logs_table_record IS 
  'Otimiza busca de logs por tabela e registro específico';