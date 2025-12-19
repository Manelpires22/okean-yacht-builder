-- Add brand and model columns to yacht_models table
ALTER TABLE yacht_models 
  ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
  ADD COLUMN IF NOT EXISTS model VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN yacht_models.brand IS 'Manufacturer brand name (e.g., OKEAN, Azimut, Ferretti)';
COMMENT ON COLUMN yacht_models.model IS 'Model name/number (e.g., 57, 42 Sport)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_yacht_models_brand ON yacht_models(brand);
CREATE INDEX IF NOT EXISTS idx_yacht_models_model ON yacht_models(model);