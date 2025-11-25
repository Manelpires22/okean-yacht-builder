-- Recriar função com search_path configurado para segurança
CREATE OR REPLACE FUNCTION create_customization_workflow_step()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;