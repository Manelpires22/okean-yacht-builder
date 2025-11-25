-- Criar função que automaticamente cria workflow step para customizações novas
CREATE OR REPLACE FUNCTION create_customization_workflow_step()
RETURNS TRIGGER AS $$
BEGIN
  -- Buscar o PM responsável pelo modelo do iate desta customização
  INSERT INTO customization_workflow_steps (customization_id, step_type, status, assigned_to)
  SELECT 
    NEW.id,
    'pm_review',
    'pending',
    pm.pm_user_id
  FROM quotations q
  LEFT JOIN pm_yacht_model_assignments pm ON pm.yacht_model_id = q.yacht_model_id
  WHERE q.id = NEW.quotation_id
  AND pm.pm_user_id IS NOT NULL
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa a função após INSERT na tabela quotation_customizations
DROP TRIGGER IF EXISTS auto_create_workflow_step ON quotation_customizations;

CREATE TRIGGER auto_create_workflow_step
  AFTER INSERT ON quotation_customizations
  FOR EACH ROW
  EXECUTE FUNCTION create_customization_workflow_step();