-- Add cost column to memorial_upgrades
ALTER TABLE memorial_upgrades ADD COLUMN IF NOT EXISTS cost numeric;

-- Migrate existing price values to cost (assuming current prices are costs)
UPDATE memorial_upgrades SET cost = price WHERE cost IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN memorial_upgrades.cost IS 'Custo do upgrade (valor de compra/produção)';
COMMENT ON COLUMN memorial_upgrades.price IS 'Preço de venda calculado ou sobrescrito';

-- Add cost column to options (already exists but let's ensure it's there)
ALTER TABLE options ADD COLUMN IF NOT EXISTS cost numeric;

-- Migrate existing base_price values to cost for options that don't have cost set
UPDATE options SET cost = base_price WHERE cost IS NULL;