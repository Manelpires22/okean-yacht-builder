-- Add RLS policies for yacht_models table to allow INSERT, UPDATE, DELETE

-- Policy for INSERT: Only admins and managers can create yacht models
CREATE POLICY "Admins and managers can create yacht models"
  ON yacht_models FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente_comercial')
  );

-- Policy for UPDATE: Only admins and managers can update yacht models
CREATE POLICY "Admins and managers can update yacht models"
  ON yacht_models FOR UPDATE
  USING (
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente_comercial')
  )
  WITH CHECK (
    has_role(auth.uid(), 'administrador') OR
    has_role(auth.uid(), 'gerente_comercial')
  );

-- Policy for DELETE: Only admins can delete yacht models
CREATE POLICY "Admins can delete yacht models"
  ON yacht_models FOR DELETE
  USING (has_role(auth.uid(), 'administrador'));