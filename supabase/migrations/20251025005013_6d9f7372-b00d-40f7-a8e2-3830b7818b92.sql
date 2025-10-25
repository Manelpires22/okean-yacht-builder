-- Add INSERT policy for quotations table
CREATE POLICY "Users can create quotations"
  ON quotations FOR INSERT
  WITH CHECK (sales_representative_id = auth.uid());