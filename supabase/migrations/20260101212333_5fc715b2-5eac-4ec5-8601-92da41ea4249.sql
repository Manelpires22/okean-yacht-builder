-- Simplify commissions: single percent field, remove unnecessary columns

-- Add single percent field
ALTER TABLE simulator_commissions ADD COLUMN IF NOT EXISTS percent numeric DEFAULT 0;

-- Migrate existing data (use percent_ferretti as base)
UPDATE simulator_commissions SET percent = COALESCE(percent_ferretti, 0) WHERE percent IS NULL OR percent = 0;

-- Remove old columns
ALTER TABLE simulator_commissions DROP COLUMN IF EXISTS percent_ferretti;
ALTER TABLE simulator_commissions DROP COLUMN IF EXISTS percent_okean;
ALTER TABLE simulator_commissions DROP COLUMN IF EXISTS display_order;