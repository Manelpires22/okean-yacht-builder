-- Inserir modelos faltantes para migração memorial_okean
-- Dados básicos - podem ser editados depois no admin

INSERT INTO yacht_models (
  code,
  name,
  base_price,
  base_delivery_days,
  is_active,
  description
) VALUES
  ('FY550', 'Ferretti Yachts 550', 5500000.00, 365, true, 'Modelo FY 550 - dados a completar'),
  ('FY670', 'Ferretti Yachts 670', 6700000.00, 365, true, 'Modelo FY 670 - dados a completar'),
  ('FY720', 'Ferretti Yachts 720', 7200000.00, 365, true, 'Modelo FY 720 - dados a completar'),
  ('FY1000', 'Ferretti Yachts 1000', 10000000.00, 545, true, 'Modelo FY 1000 - dados a completar'),
  ('OKEAN52', 'OKEAN 52', 5200000.00, 365, true, 'Modelo OKEAN 52 - dados a completar'),
  ('OKEAN57', 'OKEAN 57', 5700000.00, 365, true, 'Modelo OKEAN 57 - dados a completar')
ON CONFLICT (code) DO NOTHING;