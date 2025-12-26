-- Corrigir o contrato existente com o preço calculado correto
-- Preço base correto: R$ 11.028.358,72 (incluindo upgrades com desconto)
-- ATOs aprovadas: -R$ 302.221,78
-- Preço atual: R$ 11.028.358,72 - R$ 302.221,78 = R$ 10.726.136,94

UPDATE contracts 
SET 
  base_price = 11028358.72,
  current_total_price = 11028358.72 - 302221.78
WHERE id = 'ecaa7074-a3b4-4f4f-9bda-e44855db8832';