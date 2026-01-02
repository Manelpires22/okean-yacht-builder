-- Adicionar colunas de percentuais de trade-in na tabela simulations
ALTER TABLE simulations 
ADD COLUMN IF NOT EXISTS trade_in_operation_cost_percent numeric DEFAULT 3,
ADD COLUMN IF NOT EXISTS trade_in_commission_percent numeric DEFAULT 5,
ADD COLUMN IF NOT EXISTS trade_in_commission_reduction_percent numeric DEFAULT 0.5;

-- Comentários para documentação
COMMENT ON COLUMN simulations.trade_in_operation_cost_percent IS 'Percentual de custo operacional do trade-in (padrão 3%)';
COMMENT ON COLUMN simulations.trade_in_commission_percent IS 'Percentual de comissão sobre venda do usado (padrão 5%)';
COMMENT ON COLUMN simulations.trade_in_commission_reduction_percent IS 'Percentual de redução na comissão do vendedor principal (padrão 0.5%)';