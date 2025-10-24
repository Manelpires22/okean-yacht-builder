
-- Atualizar categorias sem criar duplicatas
-- Usar ROW_NUMBER para pegar apenas o primeiro item de cada grupo

WITH items_para_atualizar AS (
  SELECT DISTINCT ON (mi.yacht_model_id, normalize_memorial_category(mo.categoria)::memorial_category, mi.item_name)
    mi.id,
    normalize_memorial_category(mo.categoria)::memorial_category as nova_categoria
  FROM memorial_items mi
  JOIN memorial_okean mo ON (
    mi.item_name = mo.descricao_item 
    AND get_yacht_model_id(mo.modelo) = mi.yacht_model_id
  )
  WHERE mi.category = 'outros'
    AND normalize_memorial_category(mo.categoria) != 'outros'
    -- Verificar que não existe outro item com essa combinação
    AND NOT EXISTS (
      SELECT 1 FROM memorial_items mi2
      WHERE mi2.yacht_model_id = mi.yacht_model_id
        AND mi2.category = normalize_memorial_category(mo.categoria)::memorial_category
        AND mi2.item_name = mi.item_name
        AND mi2.id != mi.id
    )
)
UPDATE memorial_items
SET category = items_para_atualizar.nova_categoria
FROM items_para_atualizar
WHERE memorial_items.id = items_para_atualizar.id;
