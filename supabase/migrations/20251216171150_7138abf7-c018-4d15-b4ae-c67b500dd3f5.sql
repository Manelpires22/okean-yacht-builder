-- Adicionar coluna is_customizable à tabela options
ALTER TABLE options 
ADD COLUMN IF NOT EXISTS is_customizable boolean DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN options.is_customizable IS 'Indica se o cliente pode solicitar customização deste opcional';