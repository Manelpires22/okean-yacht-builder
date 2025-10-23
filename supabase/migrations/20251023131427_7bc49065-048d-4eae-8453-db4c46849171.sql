-- Add DELETE policies for quotations
-- Policy: Users can delete their own draft quotations
CREATE POLICY "Users can delete their own draft quotations"
  ON quotations FOR DELETE
  USING (
    sales_representative_id = auth.uid() 
    AND status = 'draft'
  );

-- Policy: Admins can delete any quotation
CREATE POLICY "Admins can delete any quotation"
  ON quotations FOR DELETE
  USING (has_role(auth.uid(), 'administrador'));

-- Update existing UPDATE policy to allow admins and managers to edit any quotation
DROP POLICY IF EXISTS "Users can update their own draft quotations" ON quotations;

CREATE POLICY "Users can update their own draft quotations"
  ON quotations FOR UPDATE
  USING (
    (sales_representative_id = auth.uid() AND status = 'draft')
    OR has_role(auth.uid(), 'administrador')
    OR has_role(auth.uid(), 'gerente_comercial')
  );