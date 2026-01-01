-- Remover constraint antiga de tipos de comissão
ALTER TABLE simulator_commissions DROP CONSTRAINT IF EXISTS simulator_commissions_type_check;

-- Adicionar nova constraint com os novos tipos + tipos legados para compatibilidade
ALTER TABLE simulator_commissions ADD CONSTRAINT simulator_commissions_type_check 
CHECK (type = ANY (ARRAY[
  'venda_interna'::text, 
  'broker_interno'::text, 
  'broker_externo'::text, 
  'parceiro'::text, 
  'sub_dealer'::text,
  'broker'::text,
  'royalty'::text,
  'other'::text
]));