-- Criar tabela para armazenar customizações solicitadas em cotações
CREATE TABLE IF NOT EXISTS quotation_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  memorial_item_id uuid REFERENCES memorial_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  notes text,
  quantity integer,
  file_paths text[],
  created_at timestamptz DEFAULT now()
);

-- Criar índice para buscas por cotação
CREATE INDEX IF NOT EXISTS idx_quotation_customizations_quotation_id 
ON quotation_customizations(quotation_id);

-- Habilitar RLS
ALTER TABLE quotation_customizations ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver customizações das suas cotações
CREATE POLICY "Users can view customizations for their quotations"
  ON quotation_customizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_customizations.quotation_id
      AND (
        quotations.sales_representative_id = auth.uid() OR
        has_role(auth.uid(), 'gerente_comercial'::app_role) OR
        has_role(auth.uid(), 'administrador'::app_role)
      )
    )
  );

-- Policy: Sistema pode criar customizações (via função)
CREATE POLICY "System can create customizations"
  ON quotation_customizations FOR INSERT
  WITH CHECK (true);

-- Policy: Admins podem gerenciar todas customizações
CREATE POLICY "Admins can manage all customizations"
  ON quotation_customizations FOR ALL
  USING (
    has_role(auth.uid(), 'administrador'::app_role)
  );

-- Criar bucket para arquivos de customização (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('customization-files', 'customization-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para storage bucket
CREATE POLICY "Users can view customization files for their quotations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'customization-files' AND
    EXISTS (
      SELECT 1 FROM quotation_customizations qc
      JOIN quotations q ON q.id = qc.quotation_id
      WHERE qc.file_paths @> ARRAY[storage.objects.name]
      AND (
        q.sales_representative_id = auth.uid() OR
        has_role(auth.uid(), 'gerente_comercial'::app_role) OR
        has_role(auth.uid(), 'administrador'::app_role)
      )
    )
  );

CREATE POLICY "Authenticated users can upload customization files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'customization-files' AND
    auth.role() = 'authenticated'
  );