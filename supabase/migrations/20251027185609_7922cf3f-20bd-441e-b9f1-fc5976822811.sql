-- ============================================================================
-- FASE 1: DATABASE SCHEMA - Sistema de Contratos e ATOs
-- ============================================================================

-- 1. Criar tabela job_stops (marcos de construção)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  display_order integer NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir Job-Stops padrão (1 a 5)
INSERT INTO public.job_stops (name, description, display_order) VALUES
  ('Job-Stop 1', 'Início da construção - Estrutura e casco', 1),
  ('Job-Stop 2', 'Instalações elétricas e hidráulicas', 2),
  ('Job-Stop 3', 'Acabamentos e mobiliário', 3),
  ('Job-Stop 4', 'Equipamentos e eletrônicos', 4),
  ('Job-Stop 5', 'Finalização e entrega', 5)
ON CONFLICT (name) DO NOTHING;

-- 2. Alterar memorial_items (adicionar campos de configuração)
-- ============================================================================
ALTER TABLE public.memorial_items 
  ADD COLUMN IF NOT EXISTS is_configurable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_stop_id uuid REFERENCES public.job_stops(id),
  ADD COLUMN IF NOT EXISTS configurable_sub_items jsonb DEFAULT '[]'::jsonb;

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_memorial_items_configurable 
  ON public.memorial_items(is_configurable) WHERE is_configurable = true;

CREATE INDEX IF NOT EXISTS idx_memorial_items_job_stop 
  ON public.memorial_items(job_stop_id);

-- 3. Alterar options (adicionar campos de configuração)
-- ============================================================================
ALTER TABLE public.options 
  ADD COLUMN IF NOT EXISTS is_configurable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_stop_id uuid REFERENCES public.job_stops(id),
  ADD COLUMN IF NOT EXISTS configurable_sub_items jsonb DEFAULT '[]'::jsonb;

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_options_configurable 
  ON public.options(is_configurable) WHERE is_configurable = true;

CREATE INDEX IF NOT EXISTS idx_options_job_stop 
  ON public.options(job_stop_id);

-- 4. Criar tabela contracts (contratos base)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES public.clients(id),
  yacht_model_id uuid NOT NULL REFERENCES public.yacht_models(id),
  
  -- Numeração
  contract_number text NOT NULL UNIQUE,
  
  -- Valores base (snapshot da cotação aprovada)
  base_price numeric NOT NULL,
  base_delivery_days integer NOT NULL,
  base_snapshot jsonb, -- snapshot completo da cotação aprovada
  
  -- Totais consolidados (base + ATOs aprovadas)
  current_total_price numeric NOT NULL,
  current_total_delivery_days integer NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Assinatura
  signed_at timestamptz DEFAULT now(),
  signed_by_name text,
  signed_by_email text,
  
  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_contracts_quotation ON public.contracts(quotation_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON public.contracts(contract_number);

-- 5. Criar tabela additional_to_orders (ATOs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.additional_to_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  
  -- Numeração sequencial por contrato
  ato_number text NOT NULL, -- Ex: "ATO-001", "ATO-002"
  sequence_number integer NOT NULL, -- 1, 2, 3...
  
  -- Descrição
  title text NOT NULL,
  description text,
  
  -- Impacto financeiro e prazo
  price_impact numeric DEFAULT 0,
  delivery_days_impact integer DEFAULT 0,
  
  -- Status do ATO
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled')),
  
  -- Solicitação
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz DEFAULT now(),
  
  -- Aprovação
  requires_approval boolean DEFAULT false,
  commercial_approval_status text CHECK (commercial_approval_status IN ('pending', 'approved', 'rejected')),
  technical_approval_status text CHECK (technical_approval_status IN ('pending', 'approved', 'rejected')),
  
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  
  -- Notas
  notes text,
  rejection_reason text,
  
  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraint: sequence_number único por contrato
  UNIQUE (contract_id, sequence_number),
  UNIQUE (contract_id, ato_number)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_atos_contract ON public.additional_to_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_atos_status ON public.additional_to_orders(status);
CREATE INDEX IF NOT EXISTS idx_atos_requested_by ON public.additional_to_orders(requested_by);

-- 6. Criar tabela ato_configurations (configurações de itens em ATOs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ato_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao ATO
  ato_id uuid NOT NULL REFERENCES public.additional_to_orders(id) ON DELETE CASCADE,
  
  -- Tipo e ID do item configurado
  item_type text NOT NULL CHECK (item_type IN ('memorial_item', 'option')),
  item_id uuid NOT NULL,
  
  -- Detalhes da configuração
  configuration_details jsonb DEFAULT '{}'::jsonb,
  sub_items jsonb DEFAULT '[]'::jsonb,
  
  -- Notas
  notes text,
  
  -- Auditoria
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_ato_config_ato ON public.ato_configurations(ato_id);
CREATE INDEX IF NOT EXISTS idx_ato_config_item ON public.ato_configurations(item_type, item_id);

-- 7. Criar view live_contracts (contrato consolidado em tempo real)
-- ============================================================================
CREATE OR REPLACE VIEW public.live_contracts AS
SELECT 
  c.id AS contract_id,
  c.contract_number,
  c.quotation_id,
  c.client_id,
  c.yacht_model_id,
  
  -- Valores base
  c.base_price,
  c.base_delivery_days,
  
  -- Soma de ATOs aprovadas
  COALESCE(SUM(ato.price_impact) FILTER (WHERE ato.status = 'approved'), 0) AS total_atos_price,
  COALESCE(SUM(ato.delivery_days_impact) FILTER (WHERE ato.status = 'approved'), 0) AS total_atos_delivery_days,
  
  -- Totais consolidados
  c.base_price + COALESCE(SUM(ato.price_impact) FILTER (WHERE ato.status = 'approved'), 0) AS current_total_price,
  c.base_delivery_days + COALESCE(SUM(ato.delivery_days_impact) FILTER (WHERE ato.status = 'approved'), 0) AS current_total_delivery_days,
  
  -- Contadores de ATOs
  COUNT(ato.id) FILTER (WHERE ato.status = 'approved') AS approved_atos_count,
  COUNT(ato.id) FILTER (WHERE ato.status = 'pending_approval') AS pending_atos_count,
  COUNT(ato.id) AS total_atos_count,
  
  -- Status do contrato
  c.status,
  c.signed_at,
  c.created_at,
  c.updated_at
  
FROM public.contracts c
LEFT JOIN public.additional_to_orders ato ON ato.contract_id = c.id
GROUP BY c.id;

-- 8. Criar trigger para updated_at
-- ============================================================================
CREATE TRIGGER update_job_stops_updated_at
  BEFORE UPDATE ON public.job_stops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_atos_updated_at
  BEFORE UPDATE ON public.additional_to_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. RLS Policies - job_stops
-- ============================================================================
ALTER TABLE public.job_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active job stops"
  ON public.job_stops FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage job stops"
  ON public.job_stops FOR ALL
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- 10. RLS Policies - contracts
-- ============================================================================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contracts"
  ON public.contracts FOR SELECT
  USING (
    created_by = auth.uid() OR
    has_role(auth.uid(), 'gerente_comercial'::app_role) OR
    has_role(auth.uid(), 'administrador'::app_role)
  );

CREATE POLICY "System can create contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and managers can update contracts"
  ON public.contracts FOR UPDATE
  USING (
    has_role(auth.uid(), 'gerente_comercial'::app_role) OR
    has_role(auth.uid(), 'administrador'::app_role)
  );

CREATE POLICY "Admins can delete contracts"
  ON public.contracts FOR DELETE
  USING (has_role(auth.uid(), 'administrador'::app_role));

-- 11. RLS Policies - additional_to_orders
-- ============================================================================
ALTER TABLE public.additional_to_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ATOs for their contracts"
  ON public.additional_to_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = additional_to_orders.contract_id
        AND (
          contracts.created_by = auth.uid() OR
          has_role(auth.uid(), 'gerente_comercial'::app_role) OR
          has_role(auth.uid(), 'administrador'::app_role)
        )
    )
  );

CREATE POLICY "Users can create ATOs for their contracts"
  ON public.additional_to_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = contract_id
        AND contracts.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own draft ATOs"
  ON public.additional_to_orders FOR UPDATE
  USING (
    (requested_by = auth.uid() AND status = 'draft') OR
    has_role(auth.uid(), 'administrador'::app_role) OR
    has_role(auth.uid(), 'gerente_comercial'::app_role)
  );

CREATE POLICY "Admins can delete ATOs"
  ON public.additional_to_orders FOR DELETE
  USING (has_role(auth.uid(), 'administrador'::app_role));

-- 12. RLS Policies - ato_configurations
-- ============================================================================
ALTER TABLE public.ato_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view configurations for their ATOs"
  ON public.ato_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.additional_to_orders ato
      JOIN public.contracts c ON c.id = ato.contract_id
      WHERE ato.id = ato_configurations.ato_id
        AND (
          c.created_by = auth.uid() OR
          has_role(auth.uid(), 'gerente_comercial'::app_role) OR
          has_role(auth.uid(), 'administrador'::app_role)
        )
    )
  );

CREATE POLICY "System can create configurations"
  ON public.ato_configurations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage configurations"
  ON public.ato_configurations FOR ALL
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- 13. Adicionar audit triggers (opcional, para rastreabilidade)
-- ============================================================================
CREATE TRIGGER audit_contracts_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_atos_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.additional_to_orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ============================================================================
-- FIM DA MIGRATION - FASE 1 COMPLETA
-- ============================================================================