-- Tabela de taxas de câmbio padrão
CREATE TABLE simulator_exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL UNIQUE CHECK (currency IN ('EUR', 'USD')),
  default_rate numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'api')),
  last_api_update timestamptz,
  updated_by uuid REFERENCES public.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabela de custos por modelo de iate
CREATE TABLE simulator_model_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_model_id uuid NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  custo_mp_import numeric NOT NULL DEFAULT 0,
  custo_mp_nacional numeric NOT NULL DEFAULT 0,
  custo_mo_horas numeric NOT NULL DEFAULT 0,
  custo_mo_valor_hora numeric NOT NULL DEFAULT 55,
  projeto text NOT NULL DEFAULT 'OKEAN' CHECK (projeto IN ('Ferretti', 'OKEAN')),
  tax_import_percent numeric NOT NULL DEFAULT 21,
  updated_by uuid REFERENCES public.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(yacht_model_id)
);

-- Tabela de comissões
CREATE TABLE simulator_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('broker', 'royalty', 'other')),
  percent_ferretti numeric NOT NULL DEFAULT 0,
  percent_okean numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  updated_by uuid REFERENCES public.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tabela de regras de negócio gerais
CREATE TABLE simulator_business_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  rule_value numeric NOT NULL DEFAULT 0,
  description text,
  category text DEFAULT 'general',
  updated_by uuid REFERENCES public.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE simulator_exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulator_model_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulator_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulator_business_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins e gerentes podem gerenciar
CREATE POLICY "Admins and managers can manage exchange rates"
  ON simulator_exchange_rates FOR ALL
  USING (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'))
  WITH CHECK (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'));

CREATE POLICY "Authenticated users can view exchange rates"
  ON simulator_exchange_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage model costs"
  ON simulator_model_costs FOR ALL
  USING (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'))
  WITH CHECK (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'));

CREATE POLICY "Authenticated users can view model costs"
  ON simulator_model_costs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage commissions"
  ON simulator_commissions FOR ALL
  USING (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'))
  WITH CHECK (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'));

CREATE POLICY "Authenticated users can view commissions"
  ON simulator_commissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage business rules"
  ON simulator_business_rules FOR ALL
  USING (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'))
  WITH CHECK (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'));

CREATE POLICY "Authenticated users can view business rules"
  ON simulator_business_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Triggers para updated_at
CREATE TRIGGER update_simulator_exchange_rates_updated_at
  BEFORE UPDATE ON simulator_exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulator_model_costs_updated_at
  BEFORE UPDATE ON simulator_model_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulator_commissions_updated_at
  BEFORE UPDATE ON simulator_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulator_business_rules_updated_at
  BEFORE UPDATE ON simulator_business_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais de câmbio
INSERT INTO simulator_exchange_rates (currency, default_rate, source) VALUES
  ('EUR', 6.20, 'manual'),
  ('USD', 5.50, 'manual');

-- Inserir regras de negócio padrão
INSERT INTO simulator_business_rules (rule_key, rule_value, description, category) VALUES
  ('tax_percent', 21, 'Imposto de importação (%)', 'taxes'),
  ('freight_percent', 2, 'Frete (%)', 'taxes'),
  ('warranty_percent', 3, 'Garantia (%)', 'taxes'),
  ('royalty_ferretti', 5, 'Royalty Ferretti (%)', 'commissions'),
  ('royalty_okean', 3, 'Royalty OKEAN (%)', 'commissions');

-- Inserir comissões padrão
INSERT INTO simulator_commissions (name, type, percent_ferretti, percent_okean, display_order) VALUES
  ('Royalties', 'royalty', 5, 3, 1),
  ('Broker Padrão', 'broker', 2.5, 2.5, 2);