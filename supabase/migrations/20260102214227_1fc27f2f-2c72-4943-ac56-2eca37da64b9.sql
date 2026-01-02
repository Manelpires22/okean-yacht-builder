-- Inserir regras de Trade-In na tabela simulator_business_rules
INSERT INTO simulator_business_rules (rule_key, rule_value, description, category) VALUES
  ('trade_in_operation_cost_percent', 3, 'Custo de Operação do Usado (%)', 'trade_in'),
  ('trade_in_commission_percent', 5, 'Comissão sobre o Usado (%)', 'trade_in'),
  ('trade_in_commission_reduction', 0.5, 'Redução da Comissão do Vendedor quando há Trade-In (%)', 'trade_in')
ON CONFLICT (rule_key) DO NOTHING;