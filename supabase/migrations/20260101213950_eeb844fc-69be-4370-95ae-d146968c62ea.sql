-- Deletar todas as regras de negócio existentes
DELETE FROM simulator_business_rules;

-- Inserir as novas regras de negócio
INSERT INTO simulator_business_rules (rule_key, rule_value, description, category) VALUES
  ('sales_tax_domestic', 21, 'Imposto de venda - Barcos não exportados (%)', 'taxes'),
  ('sales_tax_export', 0, 'Imposto de venda - Barcos exportados (%)', 'taxes'),
  ('warranty_domestic', 3, 'Garantia - Barcos não exportados (%)', 'taxes'),
  ('warranty_export', 5, 'Garantia - Barcos exportados (%)', 'taxes');