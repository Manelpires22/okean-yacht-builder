-- Criar tabela de matrículas (hull numbers)
CREATE TABLE hull_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL DEFAULT 'OKEAN',
  yacht_model_id uuid NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  hull_number varchar(2) NOT NULL,
  hull_entry_date date NOT NULL,
  estimated_delivery_date date NOT NULL,
  status text NOT NULL DEFAULT 'available',
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Uma matrícula por modelo
  CONSTRAINT hull_numbers_unique_per_model UNIQUE(yacht_model_id, hull_number),
  
  -- Validação de status
  CONSTRAINT hull_numbers_valid_status CHECK (status IN ('available', 'reserved', 'contracted'))
);

-- Adicionar colunas em quotations
ALTER TABLE quotations ADD COLUMN hull_number_id uuid REFERENCES hull_numbers(id);

-- Adicionar colunas em contracts com UNIQUE
ALTER TABLE contracts ADD COLUMN hull_number_id uuid REFERENCES hull_numbers(id);
CREATE UNIQUE INDEX idx_contracts_hull_number_unique ON contracts(hull_number_id) WHERE hull_number_id IS NOT NULL;

-- Habilitar RLS
ALTER TABLE hull_numbers ENABLE ROW LEVEL SECURITY;

-- Policies para hull_numbers
CREATE POLICY "Everyone can view hull numbers"
  ON hull_numbers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage hull numbers"
  ON hull_numbers FOR ALL
  USING (has_role(auth.uid(), 'administrador'))
  WITH CHECK (has_role(auth.uid(), 'administrador'));

-- Trigger para updated_at
CREATE TRIGGER update_hull_numbers_updated_at
  BEFORE UPDATE ON hull_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_hull_numbers_yacht_model ON hull_numbers(yacht_model_id);
CREATE INDEX idx_hull_numbers_status ON hull_numbers(status);

-- Comentários
COMMENT ON TABLE hull_numbers IS 'Matrículas de embarcações disponíveis para configuração';
COMMENT ON COLUMN hull_numbers.hull_number IS 'Número de matrícula (2 dígitos)';
COMMENT ON COLUMN hull_numbers.hull_entry_date IS 'Data de entrada do casco';
COMMENT ON COLUMN hull_numbers.estimated_delivery_date IS 'Data prevista de entrega base';