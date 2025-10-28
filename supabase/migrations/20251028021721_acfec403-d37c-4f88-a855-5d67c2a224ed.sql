-- Adicionar coluna customization_code à tabela quotation_customizations
ALTER TABLE quotation_customizations 
ADD COLUMN customization_code TEXT UNIQUE;

-- Criar índice para melhor performance
CREATE INDEX idx_customization_code ON quotation_customizations(customization_code);

-- Comentário explicativo
COMMENT ON COLUMN quotation_customizations.customization_code IS 'Código único da customização no formato QT-YYYY-XXX-VX-CUS-NNN';