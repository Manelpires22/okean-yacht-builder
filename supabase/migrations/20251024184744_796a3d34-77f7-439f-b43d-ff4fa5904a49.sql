-- Migração direta: memorial_okean → memorial_items (com cast correto)
-- Usa funções existentes: normalize_memorial_category() e get_yacht_model_id()

INSERT INTO memorial_items (
  yacht_model_id,
  category,
  category_display_order,
  item_name,
  brand,
  model,
  quantity,
  unit,
  is_customizable,
  is_active,
  display_order,
  description
)
SELECT 
  get_yacht_model_id(mo.modelo) AS yacht_model_id,
  normalize_memorial_category(mo.categoria)::memorial_category AS category,
  COALESCE(mo.category_display_order, 999) AS category_display_order,
  mo.descricao_item AS item_name,
  mo.marca AS brand,
  NULL AS model,
  COALESCE(mo.quantidade, 1) AS quantity,
  'unidade' AS unit,
  COALESCE(mo.is_customizable, true) AS is_customizable,
  true AS is_active,
  ROW_NUMBER() OVER (
    PARTITION BY get_yacht_model_id(mo.modelo), normalize_memorial_category(mo.categoria)
    ORDER BY mo.id
  ) AS display_order,
  mo.tipo_item AS description
FROM memorial_okean mo
WHERE EXISTS (
  SELECT 1 FROM yacht_models ym 
  WHERE UPPER(TRIM(ym.code)) = UPPER(TRIM(mo.modelo))
     OR REPLACE(UPPER(ym.code), ' ', '') = REPLACE(UPPER(TRIM(mo.modelo)), ' ', '')
)
ON CONFLICT (yacht_model_id, category, item_name) DO NOTHING;