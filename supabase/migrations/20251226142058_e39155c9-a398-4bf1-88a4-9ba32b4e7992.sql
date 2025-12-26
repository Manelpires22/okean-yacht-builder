-- Add reversal support to ato_configurations
ALTER TABLE ato_configurations ADD COLUMN IF NOT EXISTS is_reversal boolean DEFAULT false;
ALTER TABLE ato_configurations ADD COLUMN IF NOT EXISTS reversal_of_configuration_id uuid REFERENCES ato_configurations(id);
ALTER TABLE ato_configurations ADD COLUMN IF NOT EXISTS reversal_percentage numeric DEFAULT 100 CHECK (reversal_percentage >= 0 AND reversal_percentage <= 100);
ALTER TABLE ato_configurations ADD COLUMN IF NOT EXISTS reversal_reason text;

-- Add reversal support to additional_to_orders
ALTER TABLE additional_to_orders ADD COLUMN IF NOT EXISTS reversal_of_ato_id uuid REFERENCES additional_to_orders(id);
ALTER TABLE additional_to_orders ADD COLUMN IF NOT EXISTS is_reversal boolean DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ato_configurations_reversal ON ato_configurations(reversal_of_configuration_id) WHERE reversal_of_configuration_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_additional_to_orders_reversal ON additional_to_orders(reversal_of_ato_id) WHERE reversal_of_ato_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN ato_configurations.is_reversal IS 'Indicates if this configuration is a reversal/refund of another item';
COMMENT ON COLUMN ato_configurations.reversal_percentage IS 'Percentage of the original price to be refunded (0-100)';
COMMENT ON COLUMN ato_configurations.reversal_reason IS 'Reason for the reversal/refund';
COMMENT ON COLUMN additional_to_orders.is_reversal IS 'Indicates if this ATO is a reversal/refund ATO';