
-- Corrigir option_id da cotação V2 baseado na V1
-- Match por unit_price e delivery_days_impact (fingerprint único)

UPDATE quotation_options qo_v2
SET option_id = qo_v1.option_id
FROM quotation_options qo_v1
WHERE qo_v2.quotation_id = '8e001829-3b0f-4129-8612-0ee092026133'
  AND qo_v1.quotation_id = 'bb175ace-a133-4a15-91c4-4fcea3c1c408'
  AND qo_v2.unit_price = qo_v1.unit_price
  AND qo_v2.delivery_days_impact = qo_v1.delivery_days_impact
  AND qo_v2.option_id IS NULL;
