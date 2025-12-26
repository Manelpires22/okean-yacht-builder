-- Enum para tipos de documento PDF
DO $$ BEGIN
  CREATE TYPE pdf_document_type AS ENUM ('quotation', 'ato', 'consolidated', 'memorial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para status do template
DO $$ BEGIN
  CREATE TYPE pdf_template_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela principal de templates
CREATE TABLE IF NOT EXISTS pdf_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_type pdf_document_type NOT NULL,
  branding text DEFAULT 'OKEAN',
  description text,
  template_json jsonb NOT NULL DEFAULT '{"blocks": [], "settings": {"margins": {"top": 20, "right": 15, "bottom": 20, "left": 15}, "showPageNumbers": true, "showConfidentialityNote": true, "language": "pt-BR"}}'::jsonb,
  version integer DEFAULT 1,
  status pdf_template_status DEFAULT 'draft',
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Histórico de versões
CREATE TABLE IF NOT EXISTS pdf_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES pdf_templates(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL,
  template_json jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  change_notes text,
  created_at timestamptz DEFAULT now()
);

-- Registro de PDFs gerados (auditoria)
CREATE TABLE IF NOT EXISTS pdf_generated (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES pdf_templates(id) ON DELETE SET NULL,
  document_type pdf_document_type NOT NULL,
  reference_id uuid,
  reference_type text,
  payload jsonb,
  pdf_url text,
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pdf_templates_status ON pdf_templates(status);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_document_type ON pdf_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_pdf_template_versions_template_id ON pdf_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_pdf_generated_template_id ON pdf_generated(template_id);
CREATE INDEX IF NOT EXISTS idx_pdf_generated_reference ON pdf_generated(reference_type, reference_id);

-- Trigger para updated_at
CREATE OR REPLACE TRIGGER update_pdf_templates_updated_at
  BEFORE UPDATE ON pdf_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_generated ENABLE ROW LEVEL SECURITY;

-- RLS Policies para pdf_templates
CREATE POLICY "Admins can manage templates"
  ON pdf_templates FOR ALL
  USING (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Managers can manage templates"
  ON pdf_templates FOR ALL
  USING (has_role(auth.uid(), 'gerente_comercial'));

CREATE POLICY "Users can view active templates"
  ON pdf_templates FOR SELECT
  USING (status = 'active' AND auth.uid() IS NOT NULL);

-- RLS Policies para pdf_template_versions
CREATE POLICY "Admins can manage template versions"
  ON pdf_template_versions FOR ALL
  USING (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users can view template versions"
  ON pdf_template_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies para pdf_generated
CREATE POLICY "Admins can view all generated PDFs"
  ON pdf_generated FOR ALL
  USING (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users can view their own generated PDFs"
  ON pdf_generated FOR SELECT
  USING (generated_by = auth.uid());

CREATE POLICY "Users can create PDF records"
  ON pdf_generated FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);