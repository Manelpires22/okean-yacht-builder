-- ============================================
-- GERENCIAMENTO DE CATEGORIAS DO MEMORIAL OKEAN
-- ============================================

-- 1. RENOMEAR CATEGORIA (batch update)
CREATE OR REPLACE FUNCTION rename_memorial_category(
  p_modelo TEXT,
  p_old_name TEXT,
  p_new_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Verificar se novo nome já existe
  IF EXISTS (
    SELECT 1 FROM memorial_okean 
    WHERE modelo = p_modelo 
      AND categoria = p_new_name 
      AND categoria != p_old_name
  ) THEN
    RAISE EXCEPTION 'Categoria "%" já existe para o modelo "%"', p_new_name, p_modelo;
  END IF;

  -- Atualizar todos os itens
  UPDATE memorial_okean
  SET categoria = p_new_name
  WHERE modelo = p_modelo 
    AND categoria = p_old_name;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$;

-- 2. MESCLAR CATEGORIAS (move itens + preserva ordem)
CREATE OR REPLACE FUNCTION merge_memorial_categories(
  p_modelo TEXT,
  p_source_category TEXT,
  p_target_category TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_rows INTEGER;
  target_order INTEGER;
BEGIN
  -- Verificar se categorias existem
  IF NOT EXISTS (
    SELECT 1 FROM memorial_okean 
    WHERE modelo = p_modelo AND categoria = p_source_category
  ) THEN
    RAISE EXCEPTION 'Categoria origem "%" não existe', p_source_category;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM memorial_okean 
    WHERE modelo = p_modelo AND categoria = p_target_category
  ) THEN
    RAISE EXCEPTION 'Categoria destino "%" não existe', p_target_category;
  END IF;

  -- Obter ordem da categoria destino (para preservar)
  SELECT category_display_order INTO target_order
  FROM memorial_okean
  WHERE modelo = p_modelo AND categoria = p_target_category
  LIMIT 1;

  -- Mover todos os itens da origem para o destino
  UPDATE memorial_okean
  SET categoria = p_target_category,
      category_display_order = target_order
  WHERE modelo = p_modelo 
    AND categoria = p_source_category;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$;

-- 3. DELETAR CATEGORIA VAZIA
CREATE OR REPLACE FUNCTION delete_empty_memorial_category(
  p_modelo TEXT,
  p_categoria TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_count INTEGER;
BEGIN
  -- Contar itens na categoria
  SELECT COUNT(*) INTO item_count
  FROM memorial_okean
  WHERE modelo = p_modelo AND categoria = p_categoria;

  -- Se tem itens, não pode deletar
  IF item_count > 0 THEN
    RAISE EXCEPTION 'Categoria "%" possui % itens. Use a função de mesclar para mover os itens antes de deletar.', 
      p_categoria, item_count;
  END IF;

  -- Categoria está vazia, retornar sucesso
  RETURN true;
END;
$$;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_memorial_okean_modelo_categoria 
ON memorial_okean(modelo, categoria);