-- 1. Remover constraint antigo
ALTER TABLE contract_delivery_checklist 
DROP CONSTRAINT IF EXISTS contract_delivery_checklist_item_type_check;

-- 2. Adicionar constraint atualizado com novos tipos
ALTER TABLE contract_delivery_checklist 
ADD CONSTRAINT contract_delivery_checklist_item_type_check 
CHECK (item_type = ANY (ARRAY[
  'option'::text, 
  'upgrade'::text, 
  'customization'::text, 
  'ato_item'::text, 
  'ato_config_item'::text, 
  'memorial_item'::text
]));