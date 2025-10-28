-- Adicionar campo option_id na tabela quotation_customizations
ALTER TABLE quotation_customizations 
ADD COLUMN option_id uuid REFERENCES options(id) ON DELETE SET NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN quotation_customizations.option_id IS 'ID do opcional quando a customização é relacionada a um opcional específico (mutuamente exclusivo com memorial_item_id)';

-- Criar index para performance
CREATE INDEX idx_quotation_customizations_option_id 
ON quotation_customizations(option_id) 
WHERE option_id IS NOT NULL;