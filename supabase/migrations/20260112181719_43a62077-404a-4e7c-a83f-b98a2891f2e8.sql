-- Adicionar colunas do Plano Mestre à tabela hull_numbers
ALTER TABLE hull_numbers 
  -- Job Stops (datas)
  ADD COLUMN IF NOT EXISTS job_stop_1_date date,
  ADD COLUMN IF NOT EXISTS job_stop_2_date date,
  ADD COLUMN IF NOT EXISTS job_stop_3_date date,
  ADD COLUMN IF NOT EXISTS job_stop_4_date date,
  
  -- Marcos de Produção
  ADD COLUMN IF NOT EXISTS barco_aberto_date date,
  ADD COLUMN IF NOT EXISTS fechamento_convesdeck_date date,
  ADD COLUMN IF NOT EXISTS barco_fechado_date date,
  
  -- Testes de Qualidade
  ADD COLUMN IF NOT EXISTS teste_piscina_date date,
  ADD COLUMN IF NOT EXISTS teste_mar_date date,
  
  -- Entrega Comercial (mantém estimated_delivery_date para compatibilidade)
  ADD COLUMN IF NOT EXISTS entrega_comercial_date date;

-- Adicionar comentários para documentação
COMMENT ON COLUMN hull_numbers.job_stop_1_date IS 'Data do Job Stop 1 (Coluna M do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.job_stop_2_date IS 'Data do Job Stop 2 (Coluna O do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.job_stop_3_date IS 'Data do Job Stop 3 (Coluna Q do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.job_stop_4_date IS 'Data do Job Stop 4 (Coluna S do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.barco_aberto_date IS 'Data Barco Aberto (Coluna AN do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.fechamento_convesdeck_date IS 'Data Fechamento Convés/Casaria (Coluna AO do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.barco_fechado_date IS 'Data Barco Fechado (Coluna AP do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.teste_piscina_date IS 'Data Teste Piscina (Coluna AS do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.teste_mar_date IS 'Data Teste Mar (Coluna AT do Plano Mestre)';
COMMENT ON COLUMN hull_numbers.entrega_comercial_date IS 'Data Entrega Comercial/Disponibilidade (Coluna AV do Plano Mestre)';