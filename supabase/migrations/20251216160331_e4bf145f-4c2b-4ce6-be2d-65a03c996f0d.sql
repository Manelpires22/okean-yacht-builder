-- Remover módulo centralizado de opcionais
-- 1. Limpar dependências primeiro
DELETE FROM quotation_options;
DELETE FROM ato_configurations WHERE item_type = 'option';
UPDATE quotation_customizations SET option_id = NULL WHERE option_id IS NOT NULL;

-- 2. Deletar todos os opcionais (dados fictícios)
DELETE FROM options;