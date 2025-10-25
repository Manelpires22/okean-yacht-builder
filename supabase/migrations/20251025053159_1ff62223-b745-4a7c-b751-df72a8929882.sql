-- FASE 1: Adicionar colunas de workflow em quotation_customizations
ALTER TABLE quotation_customizations
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'pending_pm_review',
ADD COLUMN IF NOT EXISTS pm_scope TEXT,
ADD COLUMN IF NOT EXISTS engineering_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_parts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS supply_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS supply_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS supply_lead_time_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS supply_notes TEXT,
ADD COLUMN IF NOT EXISTS planning_window_start DATE,
ADD COLUMN IF NOT EXISTS planning_delivery_impact_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS planning_notes TEXT,
ADD COLUMN IF NOT EXISTS pm_final_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pm_final_delivery_impact_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pm_final_notes TEXT,
ADD COLUMN IF NOT EXISTS reject_reason TEXT,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS workflow_audit JSONB DEFAULT '[]'::jsonb;

-- Constraint para workflow_status
ALTER TABLE quotation_customizations
DROP CONSTRAINT IF EXISTS check_workflow_status;

ALTER TABLE quotation_customizations
ADD CONSTRAINT check_workflow_status
CHECK (workflow_status IN (
  'pending_pm_review',
  'pending_supply_quote',
  'pending_planning_validation',
  'pending_pm_final_approval',
  'approved',
  'rejected'
));

-- Criar tabela customization_workflow_steps
CREATE TABLE IF NOT EXISTS customization_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customization_id UUID REFERENCES quotation_customizations(id) ON DELETE CASCADE NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('pm_initial', 'supply_quote', 'planning_check', 'pm_final')),
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'rejected')),
  response_data JSONB,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_steps_customization ON customization_workflow_steps(customization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned ON customization_workflow_steps(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON customization_workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_customizations_workflow_status ON quotation_customizations(workflow_status);

-- RLS Policies para customization_workflow_steps
ALTER TABLE customization_workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view steps they're assigned to or are admins"
ON customization_workflow_steps FOR SELECT
USING (
  assigned_to = auth.uid() OR
  has_role(auth.uid(), 'administrador') OR
  has_role(auth.uid(), 'pm_engenharia')
);

CREATE POLICY "System can create workflow steps"
ON customization_workflow_steps FOR INSERT
WITH CHECK (true);

CREATE POLICY "Assigned users can update their steps"
ON customization_workflow_steps FOR UPDATE
USING (
  assigned_to = auth.uid() OR
  has_role(auth.uid(), 'administrador')
);

-- Trigger para updated_at
CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON customization_workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar tipo app_role se não existir (comprador, planejador)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('administrador', 'gerente_comercial', 'vendedor', 'pm_engenharia', 'comprador', 'planejador');
  ELSE
    -- Adicionar novos valores ao enum se não existirem
    BEGIN
      ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'pm_engenharia';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'comprador';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'planejador';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Configuração do workflow (SLA, taxas)
CREATE TABLE IF NOT EXISTS workflow_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Inserir configurações padrão
INSERT INTO workflow_config (config_key, config_value) VALUES
  ('engineering_rate', '{"rate_per_hour": 150, "currency": "BRL"}'::jsonb),
  ('contingency_percent', '{"percent": 10}'::jsonb),
  ('sla_days', '{
    "pm_initial": 2,
    "supply_quote": 5,
    "planning_check": 2,
    "pm_final": 1
  }'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- RLS para workflow_config
ALTER TABLE workflow_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read workflow config"
ON workflow_config FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage workflow config"
ON workflow_config FOR ALL
USING (has_role(auth.uid(), 'administrador'))
WITH CHECK (has_role(auth.uid(), 'administrador'));