-- Adicionar coluna code ao memorial_items
ALTER TABLE memorial_items 
ADD COLUMN code text;

-- Criar índice para buscas por código
CREATE INDEX idx_memorial_items_code ON memorial_items(code);

-- Adicionar constraint de unicidade por modelo (permite códigos iguais em modelos diferentes)
ALTER TABLE memorial_items 
ADD CONSTRAINT unique_memorial_item_code_per_model 
UNIQUE (yacht_model_id, code);