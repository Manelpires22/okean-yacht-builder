
-- Update customization in V2 to match approved V1 data
UPDATE quotation_customizations
SET 
  status = 'approved',
  workflow_status = 'approved',
  additional_cost = 138000,
  pm_scope = 'OK',
  engineering_hours = 30,
  required_parts = '["Teste"]'::jsonb,
  supply_cost = 123456,
  supply_items = '[{"part":"OK","quantity":1,"supplier":"OK","unit_cost":123456,"lead_time_days":90}]'::jsonb,
  supply_lead_time_days = 90,
  reviewed_at = now(),
  reviewed_by = (SELECT sales_representative_id FROM quotations WHERE id = '1e19b512-dc51-4242-ba6c-d04219f93d7b')
WHERE id = '1fc1bc59-bf89-4528-bd04-d1f6cd87e0fa';

-- Recalculate V2 quotation total price
UPDATE quotations
SET 
  total_customizations_price = 138000,
  final_price = final_base_price + final_options_price + 138000,
  updated_at = now()
WHERE id = '1e19b512-dc51-4242-ba6c-d04219f93d7b';
