-- =============================================
-- FIX RLS POLICIES FOR quotation_customizations
-- =============================================

-- 1. Remover política INSERT muito permissiva
DROP POLICY IF EXISTS "Authenticated users can create customizations" 
ON quotation_customizations;

-- 2. Nova política INSERT restritiva
-- Permite criar customizações apenas: Vendedor dono, Gerente Comercial, Admin
CREATE POLICY "Users can create customizations for their quotations"
ON quotation_customizations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotations q
    WHERE q.id = quotation_id
    AND (
      q.sales_representative_id = auth.uid()
      OR has_role(auth.uid(), 'gerente_comercial'::app_role)
      OR has_role(auth.uid(), 'administrador'::app_role)
    )
  )
);

-- 3. Política UPDATE
-- Permite atualizar: Vendedor dono, PM responsável, Gerente Comercial, Admin
CREATE POLICY "Users can update customizations for their quotations"
ON quotation_customizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quotations q
    LEFT JOIN pm_yacht_model_assignments pm ON pm.yacht_model_id = q.yacht_model_id
    WHERE q.id = quotation_customizations.quotation_id
    AND (
      q.sales_representative_id = auth.uid()
      OR pm.pm_user_id = auth.uid()
      OR has_role(auth.uid(), 'gerente_comercial'::app_role)
      OR has_role(auth.uid(), 'administrador'::app_role)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotations q
    LEFT JOIN pm_yacht_model_assignments pm ON pm.yacht_model_id = q.yacht_model_id
    WHERE q.id = quotation_id
    AND (
      q.sales_representative_id = auth.uid()
      OR pm.pm_user_id = auth.uid()
      OR has_role(auth.uid(), 'gerente_comercial'::app_role)
      OR has_role(auth.uid(), 'administrador'::app_role)
    )
  )
);

-- 4. Política DELETE
-- Permite deletar: Admin (sempre), Vendedor dono (apenas se pending)
CREATE POLICY "Users can delete pending customizations"
ON quotation_customizations
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role)
  OR (
    workflow_status = 'pending_pm_review'
    AND EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_customizations.quotation_id
      AND q.sales_representative_id = auth.uid()
    )
  )
);