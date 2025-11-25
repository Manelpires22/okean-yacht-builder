-- Fase 1: Remover o check constraint antigo
ALTER TABLE customization_workflow_steps DROP CONSTRAINT IF EXISTS customization_workflow_steps_step_type_check;

-- Fase 2: Limpar TODOS os steps antigos do workflow (4 stages)
DELETE FROM customization_workflow_steps
WHERE step_type IN ('pm_initial', 'supply_quote', 'planning_check', 'pm_final');

-- Fase 3: Adicionar novo check constraint que aceita apenas pm_review
ALTER TABLE customization_workflow_steps 
ADD CONSTRAINT customization_workflow_steps_step_type_check 
CHECK (step_type = 'pm_review');

-- Fase 4: Garantir que todas as customizações tenham um step pm_review
INSERT INTO customization_workflow_steps (customization_id, step_type, status, assigned_to)
SELECT 
  qc.id,
  'pm_review',
  'pending',
  pm.pm_user_id
FROM quotation_customizations qc
JOIN quotations q ON q.id = qc.quotation_id
LEFT JOIN pm_yacht_model_assignments pm ON pm.yacht_model_id = q.yacht_model_id
WHERE NOT EXISTS (
  SELECT 1 FROM customization_workflow_steps cws
  WHERE cws.customization_id = qc.id
)
AND pm.pm_user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Fase 5: Atualizar workflow_status para pending_pm_review em customizações sem status
UPDATE quotation_customizations
SET workflow_status = 'pending_pm_review'
WHERE workflow_status IS NULL OR workflow_status = '';

-- Fase 6: Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_customization_workflow_status ON quotation_customizations(workflow_status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_customization ON customization_workflow_steps(customization_id, step_type);