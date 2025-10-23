-- Fase 1: Adicionar coluna yacht_model_id à tabela options
ALTER TABLE options 
ADD COLUMN yacht_model_id uuid REFERENCES yacht_models(id) ON DELETE CASCADE;

-- Index para performance
CREATE INDEX idx_options_yacht_model ON options(yacht_model_id);

-- Comentário para documentação
COMMENT ON COLUMN options.yacht_model_id IS 'Modelo de iate ao qual este opcional pertence exclusivamente. Após migração, cada opcional pertencerá a apenas um modelo.';