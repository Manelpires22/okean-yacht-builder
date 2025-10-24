-- Adicionar novas colunas à tabela memorial_okean
ALTER TABLE memorial_okean 
  ADD COLUMN quantidade INTEGER DEFAULT 1,
  ADD COLUMN is_customizable BOOLEAN DEFAULT true,
  ADD COLUMN marca TEXT;

-- Adicionar comentários (documentação)
COMMENT ON COLUMN memorial_okean.quantidade IS 'Número de unidades do item';
COMMENT ON COLUMN memorial_okean.is_customizable IS 'Se o item pode ser customizado';
COMMENT ON COLUMN memorial_okean.marca IS 'Marca/fabricante do item';