-- Adicionar campo allow_multiple na tabela options
ALTER TABLE options ADD COLUMN allow_multiple boolean DEFAULT false;

-- Adicionar campo allow_multiple na tabela memorial_upgrades
ALTER TABLE memorial_upgrades ADD COLUMN allow_multiple boolean DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN options.allow_multiple IS 'Quando true, permite selecionar quantidade > 1 no configurador';
COMMENT ON COLUMN memorial_upgrades.allow_multiple IS 'Quando true, permite selecionar quantidade > 1 no configurador';