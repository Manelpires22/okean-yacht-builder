-- Adicionar campos de delivery status na tabela contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending_production' 
CHECK (delivery_status IN (
  'pending_production',
  'in_verification',
  'ready_for_delivery',
  'delivered'
)),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Criar tabela de checklist de entrega
CREATE TABLE IF NOT EXISTS contract_delivery_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação do item
  item_type TEXT NOT NULL CHECK (item_type IN ('option', 'customization', 'ato_item', 'memorial_item')),
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_code TEXT,
  
  -- Status de verificação
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  
  -- Observações
  verification_notes TEXT,
  photo_urls JSONB DEFAULT '[]',
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(contract_id, item_type, item_id)
);

-- Habilitar RLS
ALTER TABLE contract_delivery_checklist ENABLE ROW LEVEL SECURITY;

-- Policies para contract_delivery_checklist
CREATE POLICY "Users can view delivery checklist for their contracts"
  ON contract_delivery_checklist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_delivery_checklist.contract_id
      AND (
        contracts.created_by = auth.uid() OR
        has_role(auth.uid(), 'gerente_comercial') OR
        has_role(auth.uid(), 'administrador') OR
        has_role(auth.uid(), 'pm_engenharia')
      )
    )
  );

CREATE POLICY "PM and managers can update delivery checklist"
  ON contract_delivery_checklist FOR UPDATE
  USING (
    has_role(auth.uid(), 'pm_engenharia') OR
    has_role(auth.uid(), 'gerente_comercial') OR
    has_role(auth.uid(), 'administrador')
  );

CREATE POLICY "System can create delivery checklist items"
  ON contract_delivery_checklist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can delete delivery checklist items"
  ON contract_delivery_checklist FOR DELETE
  USING (has_role(auth.uid(), 'administrador'));

-- Trigger para updated_at
CREATE TRIGGER update_contract_delivery_checklist_updated_at
  BEFORE UPDATE ON contract_delivery_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_contract_delivery_checklist_contract_id 
  ON contract_delivery_checklist(contract_id);
CREATE INDEX idx_contract_delivery_checklist_is_verified 
  ON contract_delivery_checklist(is_verified);

-- Comentários
COMMENT ON TABLE contract_delivery_checklist IS 'Checklist de verificação de itens antes da entrega do barco';
COMMENT ON COLUMN contracts.delivery_status IS 'Status do processo de entrega do barco';
COMMENT ON COLUMN contracts.delivered_at IS 'Data e hora da entrega oficial ao cliente';
COMMENT ON COLUMN contracts.delivered_by IS 'Usuário que finalizou a entrega';