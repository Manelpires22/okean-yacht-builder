-- Remove tax_sale_percent column - toggle is informative only
ALTER TABLE simulator_model_costs DROP COLUMN IF EXISTS tax_sale_percent;