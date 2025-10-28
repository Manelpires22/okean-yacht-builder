-- Remover approvals técnicos fantasmas
-- O sistema de workflows de customização usa quotation_customizations.workflow_status
-- Approvals técnicos do tipo 'technical' não deveriam existir mais

DELETE FROM approvals 
WHERE approval_type = 'technical';

-- Adicionar comentário para documentação
COMMENT ON TABLE approvals IS 'Tabela de aprovações comerciais (descontos). Aprovações técnicas são gerenciadas via quotation_customizations.workflow_status';