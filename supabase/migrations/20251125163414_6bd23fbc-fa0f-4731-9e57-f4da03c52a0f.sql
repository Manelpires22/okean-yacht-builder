-- Remove os triggers primeiro
DROP TRIGGER IF EXISTS auto_create_customization_approval ON quotation_customizations;
DROP TRIGGER IF EXISTS trigger_create_approval_for_contract_revision ON quotation_customizations;

-- Remove as funções com CASCADE (para remover dependências automaticamente)
DROP FUNCTION IF EXISTS create_customization_approval_trigger() CASCADE;
DROP FUNCTION IF EXISTS create_approval_for_contract_revision() CASCADE;

-- Limpar aprovações duplicadas existentes de "revisão de contrato"
-- Mantém apenas a aprovação criada pelo frontend (com is_free_customization ou outras flags)
DELETE FROM approvals a1
WHERE a1.notes = 'Aprovação técnica de revisão de contrato'
  AND a1.request_details->>'is_contract_revision' = 'true'
  AND EXISTS (
    SELECT 1 
    FROM approvals a2 
    WHERE a2.request_details->>'customization_id' = a1.request_details->>'customization_id'
      AND a2.id != a1.id
      AND a2.notes != 'Aprovação técnica de revisão de contrato'
  );