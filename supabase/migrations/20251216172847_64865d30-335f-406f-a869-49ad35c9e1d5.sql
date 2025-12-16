
-- Copiar opcionais da OKEAN 57 para OKEAN 52
INSERT INTO options (
  name,
  code,
  description,
  base_price,
  category_id,
  yacht_model_id,
  is_active,
  is_configurable,
  is_customizable,
  configurable_sub_items,
  delivery_days_impact,
  job_stop_id,
  technical_specifications,
  cost,
  image_url
)
SELECT 
  name,
  REPLACE(code, 'OK57', 'OK52'),  -- Atualiza código para OK52
  description,
  base_price,
  category_id,
  '00475e39-18eb-4730-9399-536572b37163'::uuid,  -- OKEAN 52 ID
  is_active,
  is_configurable,
  is_customizable,
  configurable_sub_items,
  delivery_days_impact,
  job_stop_id,
  technical_specifications,
  cost,
  image_url
FROM options
WHERE yacht_model_id = 'aad0cf05-c32e-4078-897f-2a6db49a9f4f';  -- OKEAN 57 ID
