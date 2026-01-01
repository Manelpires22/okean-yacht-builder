-- Adicionar regra de royalties às regras de negócio
INSERT INTO simulator_business_rules (rule_key, rule_value, description, category)
VALUES ('royalties_percent', 0.6, 'Royalties (%)', 'taxes')
ON CONFLICT (rule_key) DO NOTHING;