-- Adicionar link bidirecional entre customizações e ATOs
ALTER TABLE quotation_customizations
ADD COLUMN ato_id uuid REFERENCES additional_to_orders(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_customizations_ato ON quotation_customizations(ato_id);

-- Comentários para documentação
COMMENT ON COLUMN quotation_customizations.ato_id IS 'Link para ATO criado a partir desta customização (quando contrato já existe)';
