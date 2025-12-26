-- Corrigir view live_contracts para usar MAX ao invés de SUM para dias de entrega
-- A lógica correta é considerar o maior impacto de dias (trabalhos paralelos)
-- não a soma de todos os dias

DROP VIEW IF EXISTS live_contracts;

CREATE VIEW live_contracts AS
SELECT 
  c.id AS contract_id,
  c.contract_number,
  c.quotation_id,
  c.client_id,
  c.yacht_model_id,
  c.base_price,
  c.base_delivery_days,
  
  -- Preço: mantém SUM (delta será calculado client-side via hook específico)
  COALESCE(SUM(ato.price_impact) FILTER (WHERE ato.status = 'approved'), 0) AS total_atos_price,
  
  -- ✅ CORRIGIDO: MAX ao invés de SUM para dias
  -- Trabalhos são paralelos, então o impacto é determinado pelo item mais demorado
  COALESCE(MAX(ato.delivery_days_impact) FILTER (WHERE ato.status = 'approved'), 0) AS total_atos_delivery_days,
  
  c.base_price + COALESCE(SUM(ato.price_impact) FILTER (WHERE ato.status = 'approved'), 0) AS current_total_price,
  
  -- ✅ CORRIGIDO: MAX ao invés de SUM para dias
  c.base_delivery_days + COALESCE(MAX(ato.delivery_days_impact) FILTER (WHERE ato.status = 'approved'), 0) AS current_total_delivery_days,
  
  count(ato.id) FILTER (WHERE ato.status = 'approved') AS approved_atos_count,
  count(ato.id) FILTER (WHERE ato.status = 'pending_approval') AS pending_atos_count,
  count(ato.id) AS total_atos_count,
  c.status,
  c.signed_at,
  c.created_at,
  c.updated_at
FROM contracts c
LEFT JOIN additional_to_orders ato ON ato.contract_id = c.id
GROUP BY c.id;