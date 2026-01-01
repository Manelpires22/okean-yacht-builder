-- Adicionar campos de exportação e imposto de venda
ALTER TABLE simulator_model_costs 
ADD COLUMN IF NOT EXISTS is_exportable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_sale_percent numeric DEFAULT 21;