-- Inserir aprovação faltante para customizações de contrato existentes que não têm aprovação
INSERT INTO approvals (
  quotation_id,
  approval_type,
  requested_by,
  requested_at,
  status,
  request_details,
  notes
)
SELECT 
  qc.quotation_id,
  'technical'::approval_type,
  q.sales_representative_id,
  qc.created_at,
  'pending'::approval_status,
  jsonb_build_object(
    'is_contract_revision', true,
    'customization_id', qc.id,
    'customization_code', qc.customization_code,
    'item_name', qc.item_name
  ),
  'Aprovação técnica de revisão de contrato (corrigida via migration)'
FROM quotation_customizations qc
JOIN quotations q ON q.id = qc.quotation_id
WHERE qc.included_in_contract = false
  AND qc.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM approvals a
    WHERE (a.request_details->>'customization_id')::uuid = qc.id
  );