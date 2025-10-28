-- Adicionar coluna sent_at para rastrear primeiro envio ao cliente
ALTER TABLE quotations 
ADD COLUMN sent_at TIMESTAMPTZ;

-- Criar índice para performance
CREATE INDEX idx_quotations_sent_at ON quotations(sent_at);

-- Migração de dados: preencher sent_at para cotações já enviadas
UPDATE quotations 
SET sent_at = updated_at 
WHERE status IN ('sent', 'accepted') AND sent_at IS NULL;