-- =============================================
-- OKEAN CPQ - Yacht Models Technical Data UPDATE
-- Generated: 2025-01-20
-- Purpose: Update yacht_models with technical specifications
-- that were missing in the initial migration
-- =============================================

-- =============================================
-- FY850 - Ferretti Yachts 850
-- =============================================
UPDATE yacht_models SET
  brand = N'Ferretti Yachts',
  model = N'850',
  length_overall = 26.13,
  hull_length = 23.97,
  beam = 6.28,
  draft = 2.06,
  dry_weight = 67000,
  displacement_light = 67000,
  displacement_loaded = 78000,
  fuel_capacity = 6700,
  water_capacity = 1320,
  passengers_capacity = 20,
  max_speed = 32,
  cruise_speed = 27,
  range_nautical_miles = 310,
  engines = N'2 x MTU 12V 2000 M96 de 1948 mhp (1432 kW) cada, ou 2 x MTU 16V 2000 M96 de 2435 mhp (1792 kW) cada',
  cabins = 4,
  bathrooms = N'4 + 1',
  updated_at = GETDATE()
WHERE code = 'FY850';

-- =============================================
-- FY720 - Ferretti Yachts 720
-- =============================================
UPDATE yacht_models SET
  brand = N'Ferretti Yachts',
  length_overall = 22.3,
  hull_length = 21,
  beam = 5.6,
  draft = 1.8,
  displacement_light = 46000,
  displacement_loaded = 54000,
  fuel_capacity = 4600,
  water_capacity = 1000,
  passengers_capacity = 18,
  engines = N'2 X MAN V12-1400 POWER 1029 KW/1400 MHP AT 2300 RPM',
  cabins = 5,
  bathrooms = N'3+1',
  updated_at = GETDATE()
WHERE code = 'FY720';

-- =============================================
-- FY670 - Ferretti Yachts 670
-- =============================================
UPDATE yacht_models SET
  brand = N'Ferretti Yachts',
  length_overall = 20.24,
  hull_length = 20.24,
  beam = 5.53,
  draft = 1.8,
  dry_weight = 39500,
  displacement_light = 65000,
  displacement_loaded = 47000,
  fuel_capacity = 3800,
  water_capacity = 710,
  passengers_capacity = 18,
  max_speed = 32,
  cruise_speed = 28,
  range_nautical_miles = 250,
  engines = N'2 x MAN V8 1200',
  cabins = 4,
  bathrooms = N'3 + 1',
  hull_color = N'Branco',
  updated_at = GETDATE()
WHERE code = 'FY670';

-- =============================================
-- FY550 - Ferretti Yachts 550
-- =============================================
UPDATE yacht_models SET
  brand = N'Ferretti Yachts',
  length_overall = 17.43,
  hull_length = 16.29,
  beam = 4.8,
  draft = 1.44,
  dry_weight = 24200,
  displacement_loaded = 29800,
  fuel_capacity = 2500,
  water_capacity = 660,
  passengers_capacity = 12,
  max_speed = 30,
  cruise_speed = 26,
  range_nautical_miles = 250,
  engines = N'2 x CUMMINS QSM11 (715 Mhp ou 850 Mhp)',
  cabins = 3,
  bathrooms = N'2+1',
  updated_at = GETDATE()
WHERE code = 'FY550';

-- =============================================
-- OKEAN80 - Okean 80
-- =============================================
UPDATE yacht_models SET
  brand = N'Okean',
  length_overall = 24.5,
  hull_length = 24.6,
  beam = 6.05,
  draft = 1.9,
  displacement_loaded = 62000,
  fuel_capacity = 5000,
  water_capacity = 1500,
  passengers_capacity = 18,
  max_speed = 28,
  cruise_speed = 24,
  range_nautical_miles = 350,
  engines = N'2x Man V12 1650HP',
  cabins = 4,
  bathrooms = N'4 + 1',
  updated_at = GETDATE()
WHERE code = 'OKEAN80';

-- =============================================
-- OKEAN60 - Okean 60
-- =============================================
UPDATE yacht_models SET
  brand = N'Okean',
  length_overall = 19,
  hull_length = 18.32,
  beam = 5.21,
  draft = 1.52,
  dry_weight = 35000,
  displacement_loaded = 35000,
  fuel_capacity = 3000,
  water_capacity = 550,
  passengers_capacity = 12,
  max_speed = 32,
  cruise_speed = 27,
  engines = N'2x MAN V8 1200HP',
  cabins = 3,
  bathrooms = N'2 + 1',
  updated_at = GETDATE()
WHERE code = 'OKEAN60';

-- =============================================
-- OKEAN50 - Okean 50
-- =============================================
UPDATE yacht_models SET
  brand = N'Okean',
  length_overall = 15.5,
  hull_length = 15,
  beam = 4.37,
  draft = 1.2,
  displacement_loaded = 18000,
  fuel_capacity = 1300,
  water_capacity = 380,
  passengers_capacity = 12,
  max_speed = 34,
  cruise_speed = 24,
  engines = N'2x Volvo IPS 650 / 2x Volvo IPS 800',
  cabins = 2,
  bathrooms = N'1 + 1',
  updated_at = GETDATE()
WHERE code = 'OKEAN50';

-- =============================================
-- FY1000 - Ferretti Yachts 1000 (sem dados técnicos disponíveis)
-- =============================================
UPDATE yacht_models SET
  brand = N'Ferretti Yachts',
  updated_at = GETDATE()
WHERE code = 'FY1000';

-- =============================================
-- Verification Query
-- =============================================
-- Run this to verify the updates were applied:
/*
SELECT 
  code,
  name,
  brand,
  length_overall,
  beam,
  draft,
  engines,
  cabins,
  bathrooms,
  max_speed,
  cruise_speed
FROM yacht_models
WHERE is_active = 1
ORDER BY display_order;
*/

PRINT 'Yacht models technical data update completed successfully!';
PRINT 'Updated models: FY850, FY720, FY670, FY550, OKEAN80, OKEAN60, OKEAN50, FY1000';
