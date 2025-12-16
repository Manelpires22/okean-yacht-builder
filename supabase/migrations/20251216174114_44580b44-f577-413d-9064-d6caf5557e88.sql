-- Add has_upgrades column to memorial_items
ALTER TABLE memorial_items 
ADD COLUMN IF NOT EXISTS has_upgrades boolean DEFAULT false;

-- Create memorial_upgrades table
CREATE TABLE IF NOT EXISTS memorial_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_model_id uuid NOT NULL REFERENCES yacht_models(id) ON DELETE CASCADE,
  memorial_item_id uuid NOT NULL REFERENCES memorial_items(id) ON DELETE CASCADE,
  code varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  brand varchar(100),
  model varchar(100),
  price numeric NOT NULL DEFAULT 0,
  delivery_days_impact integer DEFAULT 0,
  job_stop_id uuid REFERENCES job_stops(id),
  is_configurable boolean DEFAULT false,
  configurable_sub_items jsonb DEFAULT '[]',
  is_customizable boolean DEFAULT true,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  technical_specs jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  
  UNIQUE(yacht_model_id, code)
);

-- Create quotation_upgrades table
CREATE TABLE IF NOT EXISTS quotation_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  upgrade_id uuid NOT NULL REFERENCES memorial_upgrades(id),
  memorial_item_id uuid NOT NULL REFERENCES memorial_items(id),
  price numeric NOT NULL DEFAULT 0,
  delivery_days_impact integer DEFAULT 0,
  customization_notes text,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(quotation_id, memorial_item_id)
);

-- Enable RLS
ALTER TABLE memorial_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_upgrades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memorial_upgrades
CREATE POLICY "Admins and managers can manage upgrades" ON memorial_upgrades
  FOR ALL USING (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'))
  WITH CHECK (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'gerente_comercial'));

CREATE POLICY "Anyone can view active upgrades" ON memorial_upgrades
  FOR SELECT USING (is_active = true);

-- RLS Policies for quotation_upgrades
CREATE POLICY "Users can view their own quotation upgrades" ON quotation_upgrades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_upgrades.quotation_id 
      AND (quotations.sales_representative_id = auth.uid() OR has_role(auth.uid(), 'gerente_comercial') OR has_role(auth.uid(), 'administrador'))
    )
  );

CREATE POLICY "Users can insert upgrades for their quotations" ON quotation_upgrades
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_upgrades.quotation_id 
      AND (quotations.sales_representative_id = auth.uid() OR has_role(auth.uid(), 'gerente_comercial') OR has_role(auth.uid(), 'administrador'))
    )
  );

CREATE POLICY "Users can delete upgrades for their quotations" ON quotation_upgrades
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quotations 
      WHERE quotations.id = quotation_upgrades.quotation_id 
      AND (quotations.sales_representative_id = auth.uid() OR has_role(auth.uid(), 'gerente_comercial') OR has_role(auth.uid(), 'administrador'))
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memorial_upgrades_yacht_model ON memorial_upgrades(yacht_model_id);
CREATE INDEX IF NOT EXISTS idx_memorial_upgrades_memorial_item ON memorial_upgrades(memorial_item_id);
CREATE INDEX IF NOT EXISTS idx_quotation_upgrades_quotation ON quotation_upgrades(quotation_id);

-- Trigger updated_at
CREATE TRIGGER update_memorial_upgrades_updated_at
  BEFORE UPDATE ON memorial_upgrades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();