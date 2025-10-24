-- Criar modelo Ferretti Yachts 850
INSERT INTO yacht_models (
  code,
  name,
  description,
  base_price,
  base_delivery_days,
  is_active,
  length_overall,
  hull_length,
  beam,
  draft,
  displacement_light,
  displacement_loaded,
  fuel_capacity,
  water_capacity,
  passengers_capacity,
  cabins,
  bathrooms,
  engines
) VALUES (
  'FY850',
  'Ferretti Yachts 850',
  'Iate de luxo modelo 850 da linha Ferretti Yachts com 4+1 cabines',
  0, -- Preço a definir
  365, -- Prazo padrão de 1 ano
  true,
  26.14,
  23.98,
  6.28,
  2.00,
  67000,
  77500,
  6700,
  1320,
  20,
  5, -- 4+1 cabines
  '5+1',
  '2 x MAN V12-1900 HP'
);