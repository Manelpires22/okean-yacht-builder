-- Create simulations table for persisting simulation data
CREATE TABLE simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  simulation_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  
  -- Vendedor/Comissão
  commission_id uuid,
  commission_name text NOT NULL,
  commission_percent numeric NOT NULL,
  commission_type text,
  
  -- Modelo
  yacht_model_id uuid REFERENCES yacht_models(id) ON DELETE SET NULL,
  yacht_model_code text NOT NULL,
  yacht_model_name text NOT NULL,
  is_exporting boolean DEFAULT false,
  export_country text,
  
  -- Valores de Input
  faturamento_bruto numeric NOT NULL,
  transporte_cost numeric DEFAULT 0,
  customizacoes_estimadas numeric DEFAULT 0,
  
  -- Taxas e Alíquotas (snapshot)
  sales_tax_percent numeric NOT NULL,
  warranty_percent numeric NOT NULL,
  royalties_percent numeric NOT NULL,
  tax_import_percent numeric NOT NULL,
  
  -- Custos do Modelo (snapshot)
  custo_mp_import numeric NOT NULL,
  custo_mp_import_currency text NOT NULL,
  custo_mp_nacional numeric NOT NULL,
  custo_mo_horas numeric NOT NULL,
  custo_mo_valor_hora numeric NOT NULL,
  eur_rate numeric NOT NULL,
  usd_rate numeric NOT NULL,
  
  -- Resultados Calculados
  faturamento_liquido numeric NOT NULL,
  custo_venda numeric NOT NULL,
  margem_bruta numeric NOT NULL,
  margem_percent numeric NOT NULL,
  
  -- Metadados
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view simulations"
  ON simulations FOR SELECT
  USING (
    created_by = auth.uid() OR 
    has_role(auth.uid(), 'administrador') OR 
    has_role(auth.uid(), 'gerente_comercial')
  );

CREATE POLICY "Users can create simulations"
  ON simulations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own simulations"
  ON simulations FOR UPDATE
  USING (
    created_by = auth.uid() OR 
    has_role(auth.uid(), 'administrador')
  );

CREATE POLICY "Admins can delete simulations"
  ON simulations FOR DELETE
  USING (has_role(auth.uid(), 'administrador'));

-- Trigger for updated_at
CREATE TRIGGER update_simulations_updated_at
  BEFORE UPDATE ON simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_simulations_created_by ON simulations(created_by);
CREATE INDEX idx_simulations_client_id ON simulations(client_id);
CREATE INDEX idx_simulations_created_at ON simulations(created_at DESC);