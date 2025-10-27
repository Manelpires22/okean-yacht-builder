-- Add included_in_contract field to quotation_customizations
ALTER TABLE quotation_customizations 
ADD COLUMN included_in_contract BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX idx_quotation_customizations_included_in_contract 
ON quotation_customizations(included_in_contract) 
WHERE included_in_contract = false;

COMMENT ON COLUMN quotation_customizations.included_in_contract IS 'Indica se a customização foi incluída no contrato base (true) ou se é uma revisão pós-contrato (false)';
