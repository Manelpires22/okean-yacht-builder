-- Adicionar coluna simulation_id na tabela quotations para vincular simulação
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS simulation_id uuid REFERENCES simulations(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_quotations_simulation ON quotations(simulation_id);

-- Adicionar coluna quotation_id na tabela simulations para referência bidirecional
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_simulations_quotation ON simulations(quotation_id);