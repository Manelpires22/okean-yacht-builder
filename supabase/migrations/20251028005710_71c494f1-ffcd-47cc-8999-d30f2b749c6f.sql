-- Adicionar step pm_initial retroativamente para customizações aprovadas que não têm esse step
INSERT INTO customization_workflow_steps (
  customization_id,
  step_type,
  status,
  assigned_to,
  response_data,
  notes,
  completed_at,
  created_at,
  updated_at
)
SELECT 
  qc.id,
  'pm_initial'::text,
  'completed'::text,
  qc.reviewed_by,
  jsonb_build_object(
    'scope', qc.pm_scope,
    'engineering_hours', qc.engineering_hours,
    'required_parts', qc.required_parts
  ),
  'Step inicial criado retroativamente para manter consistência do workflow'::text,
  qc.reviewed_at,
  qc.created_at,
  qc.created_at
FROM quotation_customizations qc
WHERE qc.workflow_status IN ('approved', 'supply_pending', 'planning_pending', 'pm_final_pending')
  AND NOT EXISTS (
    SELECT 1 
    FROM customization_workflow_steps cws 
    WHERE cws.customization_id = qc.id 
      AND cws.step_type = 'pm_initial'
  );

-- Adicionar índice para performance nas consultas de workflow
CREATE INDEX IF NOT EXISTS idx_workflow_steps_customization_type 
ON customization_workflow_steps(customization_id, step_type);