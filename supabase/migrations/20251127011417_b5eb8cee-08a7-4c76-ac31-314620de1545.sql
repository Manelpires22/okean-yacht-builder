-- Adicionar coluna discount_percentage à tabela additional_to_orders
ALTER TABLE additional_to_orders 
ADD COLUMN discount_percentage numeric DEFAULT 0 
CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Adicionar comentário explicativo
COMMENT ON COLUMN additional_to_orders.discount_percentage IS 'Desconto percentual aplicado pelo vendedor na validação comercial (0-100%)';