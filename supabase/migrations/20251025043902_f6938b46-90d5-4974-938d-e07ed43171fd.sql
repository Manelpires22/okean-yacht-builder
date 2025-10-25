-- Adicionar campo department na tabela users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'department'
    ) THEN
        ALTER TABLE public.users ADD COLUMN department TEXT;
    END IF;
END $$;

-- Remover a tabela internal_users (migrar dados se necessário)
DROP TABLE IF EXISTS public.pm_yacht_model_assignments CASCADE;
DROP TABLE IF EXISTS public.internal_users CASCADE;

-- Recriar pm_yacht_model_assignments referenciando users.id
CREATE TABLE IF NOT EXISTS public.pm_yacht_model_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_user_id UUID REFERENCES public.users(id) NOT NULL,
  yacht_model_id UUID REFERENCES public.yacht_models(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(yacht_model_id)
);

-- RLS para pm_yacht_model_assignments
ALTER TABLE public.pm_yacht_model_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage PM assignments" ON public.pm_yacht_model_assignments;
CREATE POLICY "Admins can manage PM assignments"
  ON public.pm_yacht_model_assignments FOR ALL
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

DROP POLICY IF EXISTS "Everyone can view PM assignments" ON public.pm_yacht_model_assignments;
CREATE POLICY "Everyone can view PM assignments"
  ON public.pm_yacht_model_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);