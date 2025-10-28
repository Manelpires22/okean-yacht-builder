-- Criar workflow steps para customizações existentes que não têm
INSERT INTO customization_workflow_steps (customization_id, step_type, status, assigned_to)
SELECT 
  qc.id as customization_id,
  step.type as step_type,
  CASE 
    -- Se já passou dessa etapa no workflow_status, marcar como completed
    WHEN step.type = 'pm_initial' AND qc.workflow_status IN ('pending_supply_quote', 'pending_planning_validation', 'pending_pm_final_approval', 'approved') THEN 'completed'
    WHEN step.type = 'supply_quote' AND qc.workflow_status IN ('pending_planning_validation', 'pending_pm_final_approval', 'approved') THEN 'completed'
    WHEN step.type = 'planning_check' AND qc.workflow_status IN ('pending_pm_final_approval', 'approved') THEN 'completed'
    WHEN step.type = 'pm_final' AND qc.workflow_status = 'approved' THEN 'completed'
    -- Se está nessa etapa agora, marcar como pending
    WHEN step.type = 'pm_initial' AND qc.workflow_status = 'pending_pm_review' THEN 'pending'
    WHEN step.type = 'supply_quote' AND qc.workflow_status = 'pending_supply_quote' THEN 'pending'
    WHEN step.type = 'planning_check' AND qc.workflow_status = 'pending_planning_validation' THEN 'pending'
    WHEN step.type = 'pm_final' AND qc.workflow_status = 'pending_pm_final_approval' THEN 'pending'
    -- Caso contrário, marcar como pending (ainda não chegou nessa etapa)
    ELSE 'pending'
  END as status,
  -- Atribuir responsável baseado no tipo de step
  CASE 
    WHEN step.type = 'pm_initial' THEN (
      SELECT pm.pm_user_id 
      FROM pm_yacht_model_assignments pm
      WHERE pm.yacht_model_id = q.yacht_model_id
      LIMIT 1
    )
    WHEN step.type = 'supply_quote' THEN (
      SELECT ur.user_id 
      FROM user_roles ur
      WHERE ur.role = 'comprador'
      LIMIT 1
    )
    WHEN step.type = 'planning_check' THEN (
      SELECT ur.user_id 
      FROM user_roles ur
      WHERE ur.role = 'planejador'
      LIMIT 1
    )
    WHEN step.type = 'pm_final' THEN (
      SELECT pm.pm_user_id 
      FROM pm_yacht_model_assignments pm
      WHERE pm.yacht_model_id = q.yacht_model_id
      LIMIT 1
    )
  END as assigned_to
FROM quotation_customizations qc
JOIN quotations q ON q.id = qc.quotation_id
CROSS JOIN (
  VALUES 
    ('pm_initial'),
    ('supply_quote'),
    ('planning_check'),
    ('pm_final')
) AS step(type)
WHERE NOT EXISTS (
  SELECT 1 FROM customization_workflow_steps ws
  WHERE ws.customization_id = qc.id
  AND ws.step_type = step.type
)
ORDER BY qc.id, step.type;

-- Criar função para criar workflow steps automaticamente ao criar customização
CREATE OR REPLACE FUNCTION create_customization_workflow_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar os 4 steps iniciais
  INSERT INTO customization_workflow_steps (customization_id, step_type, status, assigned_to)
  VALUES
    -- PM Initial - sempre o primeiro step em pending
    (
      NEW.id,
      'pm_initial',
      'pending',
      (
        SELECT pm.pm_user_id 
        FROM pm_yacht_model_assignments pm
        JOIN quotations q ON q.yacht_model_id = pm.yacht_model_id
        WHERE q.id = NEW.quotation_id
        LIMIT 1
      )
    ),
    -- Supply Quote - criado como pending mas só será ativo depois do pm_initial
    (
      NEW.id,
      'supply_quote',
      'pending',
      (SELECT user_id FROM user_roles WHERE role = 'comprador' LIMIT 1)
    ),
    -- Planning Check
    (
      NEW.id,
      'planning_check',
      'pending',
      (SELECT user_id FROM user_roles WHERE role = 'planejador' LIMIT 1)
    ),
    -- PM Final
    (
      NEW.id,
      'pm_final',
      'pending',
      (
        SELECT pm.pm_user_id 
        FROM pm_yacht_model_assignments pm
        JOIN quotations q ON q.yacht_model_id = pm.yacht_model_id
        WHERE q.id = NEW.quotation_id
        LIMIT 1
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para chamar a função ao inserir nova customização
DROP TRIGGER IF EXISTS trigger_create_workflow_steps ON quotation_customizations;
CREATE TRIGGER trigger_create_workflow_steps
  AFTER INSERT ON quotation_customizations
  FOR EACH ROW
  EXECUTE FUNCTION create_customization_workflow_steps();