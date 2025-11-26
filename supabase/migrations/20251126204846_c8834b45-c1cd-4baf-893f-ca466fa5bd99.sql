-- Criar índices para melhorar performance das queries de ATOs

CREATE INDEX IF NOT EXISTS idx_atos_requested_by ON additional_to_orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_atos_approved_by ON additional_to_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_atos_workflow_status ON additional_to_orders(workflow_status) WHERE workflow_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_atos_contract_status ON additional_to_orders(contract_id, status);