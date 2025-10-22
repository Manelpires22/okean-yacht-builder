-- Add granular discount columns to quotations table
ALTER TABLE quotations 
  ADD COLUMN base_discount_percentage numeric DEFAULT 0 CHECK (base_discount_percentage >= 0 AND base_discount_percentage <= 100),
  ADD COLUMN options_discount_percentage numeric DEFAULT 0 CHECK (options_discount_percentage >= 0 AND options_discount_percentage <= 100),
  ADD COLUMN final_base_price numeric,
  ADD COLUMN final_options_price numeric DEFAULT 0;

-- Update existing records to maintain data consistency
UPDATE quotations 
SET 
  base_discount_percentage = COALESCE(discount_percentage, 0),
  options_discount_percentage = 0,
  final_base_price = base_price - (base_price * COALESCE(discount_percentage, 0) / 100),
  final_options_price = total_options_price
WHERE final_base_price IS NULL;

-- Make final_base_price NOT NULL after populating existing data
ALTER TABLE quotations ALTER COLUMN final_base_price SET NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN quotations.base_discount_percentage IS 'Desconto aplicado ao preço base do iate (até 10% sem aprovação)';
COMMENT ON COLUMN quotations.options_discount_percentage IS 'Desconto aplicado aos opcionais (até 8% sem aprovação)';
COMMENT ON COLUMN quotations.final_base_price IS 'Preço base após aplicação do desconto';
COMMENT ON COLUMN quotations.final_options_price IS 'Total dos opcionais após aplicação do desconto';