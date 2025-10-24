-- Permitir que usuários editem seu próprio perfil (apenas full_name e department)
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevenir edição de campos sensíveis (is_active deve permanecer igual)
    is_active = (SELECT is_active FROM public.users WHERE id = auth.uid())
  );