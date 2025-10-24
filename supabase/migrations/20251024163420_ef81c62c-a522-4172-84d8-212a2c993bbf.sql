-- Fase 1: Adicionar campo de ordenação de categoria
ALTER TABLE memorial_okean 
ADD COLUMN category_display_order INTEGER DEFAULT 999;

-- Popular ordens iniciais baseadas em ordem alfabética atual
WITH categorias_ordenadas AS (
  SELECT DISTINCT categoria, 
         ROW_NUMBER() OVER (ORDER BY categoria) as ordem
  FROM memorial_okean
)
UPDATE memorial_okean m
SET category_display_order = co.ordem
FROM categorias_ordenadas co
WHERE m.categoria = co.categoria;

-- Criar índice para performance
CREATE INDEX idx_memorial_okean_category_order 
ON memorial_okean(modelo, category_display_order);

-- Criar função RPC para atualizar ordem de categorias em batch
CREATE OR REPLACE FUNCTION update_memorial_category_orders(
  p_modelo TEXT,
  p_orders JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_item JSONB;
BEGIN
  FOR order_item IN SELECT * FROM jsonb_array_elements(p_orders)
  LOOP
    UPDATE memorial_okean
    SET category_display_order = (order_item->>'order')::INTEGER
    WHERE modelo = p_modelo 
      AND categoria = order_item->>'categoria';
  END LOOP;
END;
$$;