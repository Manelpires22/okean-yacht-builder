-- 1. Atualizar campo brand dos modelos Ferretti (que estão vazios)
UPDATE yacht_models 
SET brand = 'Ferretti Yachts' 
WHERE (name ILIKE 'Ferretti%' OR code LIKE 'FY%') 
  AND (brand IS NULL OR brand = '');

-- 2. Renomear a regra existente para Ferretti e atualizar valor para 6%
UPDATE simulator_business_rules 
SET rule_key = 'royalties_percent_ferretti',
    rule_value = 6, 
    description = 'Royalties para Ferretti Yachts (%)' 
WHERE rule_key = 'royalties_percent';

-- 3. Criar nova regra para OKEAN (1%)
INSERT INTO simulator_business_rules (rule_key, rule_value, description, category) 
VALUES ('royalties_percent_okean', 1, 'Royalties para OKEAN (%)', 'taxes')
ON CONFLICT (rule_key) DO NOTHING;