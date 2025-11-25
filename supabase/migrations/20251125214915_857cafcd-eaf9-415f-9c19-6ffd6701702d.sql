-- ============================================
-- FASE 1: Adicionar Workflow Técnico às ATOs
-- ============================================

-- 1. Adicionar workflow_status à tabela additional_to_orders
ALTER TABLE additional_to_orders 
ADD COLUMN workflow_status text DEFAULT NULL;

COMMENT ON COLUMN additional_to_orders.workflow_status IS 'Status do workflow técnico: pending_pm_review, pending_supply, pending_planning, pending_pm_final, completed, rejected';

-- 2. Criar tabela ato_workflow_steps para rastrear etapas do workflow
CREATE TABLE ato_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ato_id uuid NOT NULL REFERENCES additional_to_orders(id) ON DELETE CASCADE,
  step_type text NOT NULL CHECK (step_type IN ('pm_review', 'supply_quote', 'planning_validation', 'pm_final')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'rejected')),
  assigned_to uuid REFERENCES users(id),
  response_data jsonb DEFAULT '{}',
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ato_workflow_steps_ato_id ON ato_workflow_steps(ato_id);
CREATE INDEX idx_ato_workflow_steps_assigned_to ON ato_workflow_steps(assigned_to);
CREATE INDEX idx_ato_workflow_steps_status ON ato_workflow_steps(status);

-- RLS Policies para ato_workflow_steps
ALTER TABLE ato_workflow_steps ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage ATO workflow steps"
  ON ato_workflow_steps FOR ALL
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- Usuários podem ver steps que estão atribuídos a eles ou são PMs
CREATE POLICY "Users can view ATO workflow steps they're assigned to"
  ON ato_workflow_steps FOR SELECT
  USING (
    assigned_to = auth.uid() OR 
    has_role(auth.uid(), 'administrador'::app_role) OR 
    has_role(auth.uid(), 'pm_engenharia'::app_role)
  );

-- Usuários atribuídos podem atualizar seus steps
CREATE POLICY "Assigned users can update their ATO workflow steps"
  ON ato_workflow_steps FOR UPDATE
  USING (
    assigned_to = auth.uid() OR 
    has_role(auth.uid(), 'administrador'::app_role)
  );

-- Sistema pode criar workflow steps
CREATE POLICY "System can create ATO workflow steps"
  ON ato_workflow_steps FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ato_workflow_steps_updated_at
  BEFORE UPDATE ON ato_workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Criar função para criar workflow steps automaticamente ao criar ATO
CREATE OR REPLACE FUNCTION create_ato_workflow_steps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se a ATO tem workflow_status inicial, criar steps
  IF NEW.workflow_status IS NOT NULL THEN
    -- Buscar o PM responsável pelo modelo do iate deste contrato
    INSERT INTO ato_workflow_steps (ato_id, step_type, status, assigned_to)
    SELECT 
      NEW.id,
      'pm_review',
      'pending',
      pm.pm_user_id
    FROM contracts c
    LEFT JOIN pm_yacht_model_assignments pm ON pm.yacht_model_id = c.yacht_model_id
    WHERE c.id = NEW.contract_id
    AND pm.pm_user_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para criar workflow steps ao inserir ATO
CREATE TRIGGER trigger_create_ato_workflow_steps
  AFTER INSERT ON additional_to_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_ato_workflow_steps();