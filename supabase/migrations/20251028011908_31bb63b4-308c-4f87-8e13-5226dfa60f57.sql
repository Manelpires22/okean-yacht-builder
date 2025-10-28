-- Add missing RLS policies for quotation_options table

-- Policy to allow inserting quotation options for own quotations
CREATE POLICY "Users can insert options for their quotations"
  ON quotation_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_options.quotation_id
        AND (
          quotations.sales_representative_id = auth.uid()
          OR has_role(auth.uid(), 'gerente_comercial'::app_role)
          OR has_role(auth.uid(), 'administrador'::app_role)
        )
    )
  );

-- Policy to allow updating quotation options for own quotations
CREATE POLICY "Users can update options for their quotations"
  ON quotation_options FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_options.quotation_id
        AND (
          quotations.sales_representative_id = auth.uid()
          OR has_role(auth.uid(), 'gerente_comercial'::app_role)
          OR has_role(auth.uid(), 'administrador'::app_role)
        )
    )
  );

-- Policy to allow deleting quotation options for own quotations
CREATE POLICY "Users can delete options for their quotations"
  ON quotation_options FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_options.quotation_id
        AND (
          quotations.sales_representative_id = auth.uid()
          OR has_role(auth.uid(), 'gerente_comercial'::app_role)
          OR has_role(auth.uid(), 'administrador'::app_role)
        )
    )
  );