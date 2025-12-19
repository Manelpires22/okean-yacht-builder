-- Adicionar campos de status de aprovação individual por item
ALTER TABLE ato_configurations 
ADD COLUMN pm_status text DEFAULT 'pending' CHECK (pm_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE ato_configurations 
ADD COLUMN pm_notes text;

ALTER TABLE ato_configurations 
ADD COLUMN pm_reviewed_by uuid REFERENCES auth.users(id);

ALTER TABLE ato_configurations 
ADD COLUMN pm_reviewed_at timestamptz;

ALTER TABLE ato_configurations 
ADD COLUMN delivery_impact_days integer DEFAULT 0;

-- Campos para customizações que precisam de análise completa
ALTER TABLE ato_configurations 
ADD COLUMN materials jsonb DEFAULT '[]'::jsonb;

ALTER TABLE ato_configurations 
ADD COLUMN labor_hours numeric DEFAULT 0;

ALTER TABLE ato_configurations 
ADD COLUMN labor_cost_per_hour numeric DEFAULT 55;

ALTER TABLE ato_configurations 
ADD COLUMN calculated_price numeric;

-- Comentários explicativos
COMMENT ON COLUMN ato_configurations.pm_status IS 'Status de aprovação do PM: pending, approved, rejected';
COMMENT ON COLUMN ato_configurations.delivery_impact_days IS 'Impacto no prazo de entrega em dias';
COMMENT ON COLUMN ato_configurations.materials IS 'Lista de materiais necessários (para customizações)';
COMMENT ON COLUMN ato_configurations.labor_hours IS 'Horas de mão de obra (para customizações)';
COMMENT ON COLUMN ato_configurations.calculated_price IS 'Preço calculado pelo PM (para customizações)';