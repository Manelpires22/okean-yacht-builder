-- Add fields for adjusted commission based on MDC performance
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS adjusted_commission_percent numeric;
ALTER TABLE simulations ADD COLUMN IF NOT EXISTS commission_adjustment_factor numeric;

COMMENT ON COLUMN simulations.adjusted_commission_percent IS 'Comissão ajustada baseada na MDC real vs 30% ideal';
COMMENT ON COLUMN simulations.commission_adjustment_factor IS 'Fator de ajuste: (MDC - 30%) / 30%';