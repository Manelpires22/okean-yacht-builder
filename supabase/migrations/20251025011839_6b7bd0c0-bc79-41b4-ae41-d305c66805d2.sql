-- Criar bucket para PDFs de propostas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quotation-pdfs', 'quotation-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload quotation PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'quotation-pdfs' AND
    auth.role() = 'authenticated'
  );

-- Policy: PDFs são públicos para visualização
CREATE POLICY "Quotation PDFs are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quotation-pdfs');