-- Criar enum para tipos de departamento
DO $$ BEGIN
    CREATE TYPE public.department_type AS ENUM (
      'commercial',
      'engineering', 
      'supply',
      'planning',
      'backoffice'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de usuários internos
CREATE TABLE IF NOT EXISTS public.internal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  department department_type NOT NULL,
  role_specialty TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.internal_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Admins can manage internal users" ON public.internal_users;
CREATE POLICY "Admins can manage internal users"
  ON public.internal_users FOR ALL
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view internal users" ON public.internal_users;
CREATE POLICY "Authenticated users can view internal users"
  ON public.internal_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Criar tabela de atribuições PM-Modelo
CREATE TABLE IF NOT EXISTS public.pm_yacht_model_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_user_id UUID REFERENCES auth.users(id) NOT NULL,
  yacht_model_id UUID REFERENCES yacht_models(id) NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(yacht_model_id)
);

-- RLS
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