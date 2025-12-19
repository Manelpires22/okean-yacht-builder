-- Corrigir contrato CTR-2025-3477 que ficou com valores incorretos após deleção de ATO
UPDATE contracts
SET 
  current_total_price = base_price,
  current_total_delivery_days = base_delivery_days,
  updated_at = now()
WHERE id = '27b21098-91b2-461d-b339-25d447360ff4'
AND NOT EXISTS (
  SELECT 1 FROM additional_to_orders 
  WHERE contract_id = '27b21098-91b2-461d-b339-25d447360ff4' 
  AND status = 'approved'
);