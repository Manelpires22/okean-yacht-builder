-- Add currency column for imported materials
ALTER TABLE simulator_model_costs 
ADD COLUMN IF NOT EXISTS custo_mp_import_currency text DEFAULT 'EUR' CHECK (custo_mp_import_currency IN ('EUR', 'USD'));

-- Remove projeto column (no longer needed)
ALTER TABLE simulator_model_costs DROP COLUMN IF EXISTS projeto;