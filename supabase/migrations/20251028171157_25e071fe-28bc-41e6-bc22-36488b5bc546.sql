-- Fix Sistema de Som premium workflow that was approved but didn't start
-- This migration initializes the workflow for the contract revision that was already approved

DO $$
DECLARE
  v_customization_id uuid := '6c1dfff3-b5e3-4c46-a552-9de151535a4d';
  v_quotation_id uuid;
  v_pm_user_id uuid;
  v_approved_by uuid;
BEGIN
  -- Get quotation_id from the customization
  SELECT quotation_id INTO v_quotation_id
  FROM quotation_customizations
  WHERE id = v_customization_id;

  -- Get the approval that was already approved
  SELECT reviewed_by INTO v_approved_by
  FROM approvals
  WHERE (request_details->>'customization_id')::uuid = v_customization_id
    AND status = 'approved'
  LIMIT 1;

  -- Get PM assigned to this yacht model
  SELECT pm.pm_user_id INTO v_pm_user_id
  FROM quotations q
  JOIN pm_yacht_model_assignments pm ON pm.yacht_model_id = q.yacht_model_id
  WHERE q.id = v_quotation_id
  LIMIT 1;

  -- Update customization to pending_pm_review status (only if still pending)
  UPDATE quotation_customizations
  SET 
    workflow_status = 'pending_pm_review',
    reviewed_by = v_approved_by,
    reviewed_at = now()
  WHERE id = v_customization_id
    AND status = 'pending';

  -- Create workflow step if it doesn't exist
  INSERT INTO customization_workflow_steps (
    customization_id,
    step_type,
    status,
    assigned_to,
    notes
  )
  SELECT
    v_customization_id,
    'pm_initial',
    'pending',
    v_pm_user_id,
    'Aprovação técnica concedida. Aguardando análise inicial do PM (corrigido via migration).'
  WHERE NOT EXISTS (
    SELECT 1 
    FROM customization_workflow_steps 
    WHERE customization_id = v_customization_id
      AND step_type = 'pm_initial'
  );

  RAISE NOTICE 'Workflow initialized for Sistema de Som premium';
END $$;