-- Adicionar coluna export_currency na tabela simulations
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS export_currency text CHECK (export_currency IN ('USD', 'EUR'));