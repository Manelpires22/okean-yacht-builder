-- Adicionar campos de especificações técnicas à tabela yacht_models

-- Dimensões
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS length_overall NUMERIC;
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS beam NUMERIC;
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS draft NUMERIC;
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS height_from_waterline NUMERIC;

-- Pesos e Capacidades
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS dry_weight NUMERIC;
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS fuel_capacity NUMERIC;
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS water_capacity NUMERIC;
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS passengers_capacity INTEGER;

-- Performance
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS max_speed NUMERIC;
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS cruise_speed NUMERIC;
ALTER TABLE yacht_models ADD COLUMN IF NOT EXISTS range_nautical_miles NUMERIC;

-- Comentários para documentação
COMMENT ON COLUMN yacht_models.length_overall IS 'Comprimento total em metros';
COMMENT ON COLUMN yacht_models.beam IS 'Largura em metros';
COMMENT ON COLUMN yacht_models.draft IS 'Calado em metros';
COMMENT ON COLUMN yacht_models.height_from_waterline IS 'Altura da linha d''água ao topo em metros';
COMMENT ON COLUMN yacht_models.dry_weight IS 'Peso a seco em kg';
COMMENT ON COLUMN yacht_models.fuel_capacity IS 'Capacidade de combustível em litros';
COMMENT ON COLUMN yacht_models.water_capacity IS 'Capacidade de água em litros';
COMMENT ON COLUMN yacht_models.passengers_capacity IS 'Capacidade de passageiros';
COMMENT ON COLUMN yacht_models.max_speed IS 'Velocidade máxima em nós';
COMMENT ON COLUMN yacht_models.cruise_speed IS 'Velocidade de cruzeiro em nós';
COMMENT ON COLUMN yacht_models.range_nautical_miles IS 'Autonomia em milhas náuticas';