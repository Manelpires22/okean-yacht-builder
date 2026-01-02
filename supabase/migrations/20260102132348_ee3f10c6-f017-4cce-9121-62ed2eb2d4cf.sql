-- Add trade-in fields to simulations table
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS has_trade_in boolean DEFAULT false;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_brand text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_model text;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_year integer;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_entry_value numeric DEFAULT 0;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_real_value numeric DEFAULT 0;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_depreciation numeric DEFAULT 0;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_operation_cost numeric DEFAULT 0;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_commission numeric DEFAULT 0;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS trade_in_total_impact numeric DEFAULT 0;