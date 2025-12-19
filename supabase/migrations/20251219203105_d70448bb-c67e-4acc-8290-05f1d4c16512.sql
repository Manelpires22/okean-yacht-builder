-- 1. Corrigir constraint para aceitar 'upgrade' e 'ato_item'
ALTER TABLE ato_configurations DROP CONSTRAINT IF EXISTS ato_configurations_item_type_check;

ALTER TABLE ato_configurations ADD CONSTRAINT ato_configurations_item_type_check 
CHECK (item_type = ANY (ARRAY['memorial_item'::text, 'option'::text, 'upgrade'::text, 'ato_item'::text, 'free_customization'::text, 'definable_item'::text]));

-- 2. Adicionar campos de desconto por item em ato_configurations
ALTER TABLE ato_configurations ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0;
ALTER TABLE ato_configurations ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT 0;

-- 3. Adicionar campo de desconto por valor fixo em additional_to_orders
ALTER TABLE additional_to_orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE additional_to_orders ADD COLUMN IF NOT EXISTS original_price_impact numeric;