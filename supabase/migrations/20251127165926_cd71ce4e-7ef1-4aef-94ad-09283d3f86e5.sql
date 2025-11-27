-- =====================================================
-- VIEW 1: Estatísticas de Cotações
-- Substitui múltiplas queries em QuotationsDashboard
-- =====================================================
CREATE OR REPLACE VIEW quotation_stats AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status IN ('pending_commercial_approval', 'pending_technical_approval')) as pending_approval,
  COUNT(*) FILTER (WHERE status = 'ready_to_send') as ready_to_send,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
  COUNT(*) FILTER (WHERE status = 'draft') as draft,
  COUNT(*) FILTER (WHERE status = 'sent' 
    AND valid_until IS NOT NULL 
    AND valid_until <= CURRENT_DATE + INTERVAL '7 days'
    AND valid_until >= CURRENT_DATE) as expiring_soon,
  COALESCE(SUM(final_price) FILTER (WHERE status NOT IN ('rejected', 'expired')), 0) as total_value,
  COALESCE(SUM(final_price) FILTER (WHERE status = 'accepted'), 0) as accepted_value,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_quotations
FROM quotations;

-- =====================================================
-- VIEW 2: Estatísticas de Contratos e ATOs
-- Substitui múltiplas queries em useContractStats
-- =====================================================
CREATE OR REPLACE VIEW contract_stats AS
SELECT
  -- Contratos
  COUNT(DISTINCT c.id) as total_contracts,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_contracts,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_contracts,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'cancelled') as cancelled_contracts,
  COALESCE(SUM(DISTINCT c.current_total_price), 0) as total_revenue,
  
  -- ATOs
  COUNT(a.id) as total_atos,
  COUNT(a.id) FILTER (WHERE a.status IN ('draft', 'pending_approval')) as pending_atos,
  COUNT(a.id) FILTER (WHERE a.status = 'approved') as approved_atos,
  COUNT(a.id) FILTER (WHERE a.status = 'rejected') as rejected_atos,
  COALESCE(SUM(a.price_impact) FILTER (WHERE a.status = 'approved'), 0) as total_ato_revenue,
  
  -- Médias
  COALESCE(AVG(c.current_total_delivery_days), 0) as avg_delivery_days
FROM contracts c
LEFT JOIN additional_to_orders a ON a.contract_id = c.id;

-- =====================================================
-- VIEW 3: Estatísticas Gerais (Admin Dashboard)
-- Substitui queries em useStats
-- =====================================================
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM yacht_models WHERE is_active = true) as models_count,
  (SELECT COUNT(*) FROM option_categories WHERE is_active = true) as categories_count,
  (SELECT COUNT(*) FROM options WHERE is_active = true) as options_count,
  (SELECT COUNT(*) FROM quotations) as quotations_count,
  (SELECT COUNT(*) FROM users WHERE is_active = true) as users_count,
  (SELECT COUNT(*) FROM contracts) as contracts_count;

-- =====================================================
-- VIEW 4: Tarefas Pendentes de Workflow
-- Para cards de tarefas em dashboards
-- =====================================================
CREATE OR REPLACE VIEW workflow_pending_tasks AS
SELECT
  COUNT(*) FILTER (WHERE workflow_status = 'pending_pm_review') as pending_pm_tasks,
  COUNT(*) FILTER (WHERE workflow_status = 'pending_commercial_review') as pending_commercial_tasks,
  COUNT(*) FILTER (WHERE workflow_status = 'pending_supply_review') as pending_supply_tasks,
  COUNT(*) FILTER (WHERE workflow_status = 'pending_planning_review') as pending_planning_tasks
FROM quotation_customizations;

-- =====================================================
-- RLS: Permitir acesso às views para usuários autenticados
-- =====================================================
GRANT SELECT ON quotation_stats TO authenticated;
GRANT SELECT ON contract_stats TO authenticated;
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT ON workflow_pending_tasks TO authenticated;

-- =====================================================
-- ÍNDICES para otimizar as views
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON quotations(valid_until) WHERE status = 'sent';
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_atos_status ON additional_to_orders(status);
CREATE INDEX IF NOT EXISTS idx_customizations_workflow_status ON quotation_customizations(workflow_status);