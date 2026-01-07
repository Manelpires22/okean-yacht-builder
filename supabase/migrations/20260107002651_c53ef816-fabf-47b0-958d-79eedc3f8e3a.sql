
-- =====================================================
-- FIX live_contracts VIEW - Add missing calculated fields
-- =====================================================

DROP VIEW IF EXISTS live_contracts;
CREATE VIEW live_contracts 
WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.id as contract_id,
  c.quotation_id,
  c.client_id,
  c.yacht_model_id,
  c.contract_number,
  c.base_price,
  c.base_delivery_days,
  c.base_snapshot,
  c.current_total_price,
  c.current_total_delivery_days,
  c.status,
  c.signed_at,
  c.signed_by_name,
  c.signed_by_email,
  c.created_at,
  c.updated_at,
  c.created_by,
  c.delivery_status,
  c.delivered_at,
  c.delivered_by,
  c.delivery_notes,
  c.hull_number_id,
  -- Calculated ATO fields
  COALESCE(ato_stats.total_atos_count, 0) as total_atos_count,
  COALESCE(ato_stats.approved_atos_count, 0) as approved_atos_count,
  COALESCE(ato_stats.pending_atos_count, 0) as pending_atos_count,
  COALESCE(ato_stats.total_atos_price, 0) as total_atos_price,
  COALESCE(ato_stats.total_atos_delivery_days, 0) as total_atos_delivery_days
FROM contracts c
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as total_atos_count,
    COUNT(*) FILTER (WHERE a.status = 'approved') as approved_atos_count,
    COUNT(*) FILTER (WHERE a.status IN ('draft', 'pending_approval', 'pending_pm_review')) as pending_atos_count,
    COALESCE(SUM(a.price_impact) FILTER (WHERE a.status = 'approved'), 0) as total_atos_price,
    COALESCE(MAX(a.delivery_days_impact) FILTER (WHERE a.status = 'approved'), 0) as total_atos_delivery_days
  FROM additional_to_orders a
  WHERE a.contract_id = c.id
) ato_stats ON true
WHERE c.status = 'active';
