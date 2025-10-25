-- Criar tabela de configuração de limites de desconto
CREATE TABLE IF NOT EXISTS public.discount_limits_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type TEXT NOT NULL CHECK (limit_type IN ('base', 'options')),
  no_approval_max NUMERIC NOT NULL CHECK (no_approval_max >= 0 AND no_approval_max <= 100),
  director_approval_max NUMERIC NOT NULL CHECK (director_approval_max >= no_approval_max AND director_approval_max <= 100),
  admin_approval_required_above NUMERIC NOT NULL CHECK (admin_approval_required_above >= director_approval_max),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(limit_type)
);

-- Seed inicial com valores padrão (apenas se não existir)
INSERT INTO public.discount_limits_config (limit_type, no_approval_max, director_approval_max, admin_approval_required_above)
VALUES 
  ('base', 10, 15, 15),
  ('options', 8, 12, 12)
ON CONFLICT (limit_type) DO NOTHING;

-- RLS
ALTER TABLE public.discount_limits_config ENABLE ROW LEVEL SECURITY;

-- Policy simplificada: apenas autenticados podem ver
DROP POLICY IF EXISTS "Everyone can view discount limits" ON public.discount_limits_config;
CREATE POLICY "Authenticated users can view discount limits"
  ON public.discount_limits_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy para admins gerenciarem
DROP POLICY IF EXISTS "Admins can manage discount limits" ON public.discount_limits_config;
CREATE POLICY "Admins can manage discount limits"
  ON public.discount_limits_config FOR ALL
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));