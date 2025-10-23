-- Enum para categorias do memorial descritivo
CREATE TYPE memorial_category AS ENUM (
  'dimensoes',
  'motorizacao',
  'sistema_eletrico',
  'sistema_hidraulico',
  'acabamentos',
  'equipamentos',
  'seguranca',
  'conforto',
  'outros'
);

-- Tabela memorial_items
CREATE TABLE memorial_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_model_id UUID REFERENCES yacht_models(id) ON DELETE CASCADE NOT NULL,
  
  -- Organização
  category memorial_category NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Dados do Item
  item_name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  model TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit TEXT DEFAULT 'unidade',
  
  -- Especificações técnicas adicionais (opcional)
  technical_specs JSONB,
  
  -- Controle de customização
  is_customizable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(yacht_model_id, category, item_name)
);

-- Índices para performance
CREATE INDEX idx_memorial_items_yacht_model ON memorial_items(yacht_model_id);
CREATE INDEX idx_memorial_items_category ON memorial_items(category);
CREATE INDEX idx_memorial_items_active ON memorial_items(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_memorial_items_updated_at
BEFORE UPDATE ON memorial_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE memorial_items ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem visualizar itens ativos
CREATE POLICY "Anyone can view active memorial items"
  ON memorial_items FOR SELECT
  USING (is_active = true);

-- Policy: Admins e gerentes podem gerenciar tudo
CREATE POLICY "Admins and managers can manage memorial items"
  ON memorial_items FOR ALL
  USING (
    has_role(auth.uid(), 'administrador'::app_role) OR 
    has_role(auth.uid(), 'gerente_comercial'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'administrador'::app_role) OR 
    has_role(auth.uid(), 'gerente_comercial'::app_role)
  );