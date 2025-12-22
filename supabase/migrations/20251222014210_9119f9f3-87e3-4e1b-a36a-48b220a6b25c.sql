-- =============================================
-- Tabela de Configurações do Sistema
-- Centraliza valores que antes eram hardcoded
-- =============================================

CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  category text DEFAULT 'general',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);

-- Habilitar RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Authenticated users can view config"
  ON system_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage config"
  ON system_config FOR ALL
  USING (has_role(auth.uid(), 'administrador'))
  WITH CHECK (has_role(auth.uid(), 'administrador'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Inserir configurações iniciais
-- =============================================

INSERT INTO system_config (config_key, config_value, description, category) VALUES
  -- Configurações de Cotação
  ('quotation_validity_days', '30', 'Dias de validade padrão para cotações', 'quotation'),
  
  -- Configurações de Precificação
  ('default_labor_cost_per_hour', '55', 'Custo padrão por hora de mão de obra (R$)', 'pricing'),
  ('pricing_markup_divisor', '0.43', 'Divisor para cálculo de markup (1 - impostos - margem). Preço sugerido = Custo / divisor', 'pricing'),
  ('pricing_margin_percent', '30', 'Percentual de margem de lucro', 'pricing'),
  ('pricing_tax_percent', '21', 'Percentual de impostos', 'pricing'),
  ('pricing_warranty_percent', '3', 'Percentual de garantia', 'pricing'),
  ('pricing_commission_percent', '3', 'Percentual de comissão', 'pricing'),
  
  -- Configurações de Cache
  ('cache_stale_time_ms', '30000', 'Tempo de stale para cache de queries (ms)', 'cache'),
  ('workflow_refetch_interval_ms', '60000', 'Intervalo de refetch para workflow (ms)', 'cache'),
  
  -- Configurações da Empresa
  ('company_name', '"OKEAN Yachts"', 'Nome da empresa para emails e PDFs', 'company'),
  ('company_email', '"contato@okeanyachts.com"', 'Email de contato principal', 'company'),
  ('app_url', '"https://okean.lovable.app"', 'URL do sistema', 'company')
  
ON CONFLICT (config_key) DO NOTHING;