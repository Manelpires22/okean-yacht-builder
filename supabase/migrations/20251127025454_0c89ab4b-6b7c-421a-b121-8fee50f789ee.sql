-- Criar tabela workflow_settings para configurações globais de workflow
CREATE TABLE IF NOT EXISTS public.workflow_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  config_data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.workflow_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler
CREATE POLICY "Everyone can read workflow settings"
  ON public.workflow_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Apenas admins podem modificar
CREATE POLICY "Only admins can manage workflow settings"
  ON public.workflow_settings
  FOR ALL
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- Criar índice em setting_key para performance
CREATE INDEX IF NOT EXISTS idx_workflow_settings_key 
  ON public.workflow_settings(setting_key);

-- Ativar workflow simplificado globalmente
INSERT INTO public.workflow_settings (setting_key, enabled, config_data)
VALUES ('simplified_workflow', true, '{"description": "Workflow simplificado ativado globalmente para todas as customizações"}'::jsonb)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  enabled = true,
  updated_at = now();

-- Verificação e confirmação
DO $$
DECLARE
  workflow_enabled boolean;
BEGIN
  SELECT enabled INTO workflow_enabled 
  FROM public.workflow_settings 
  WHERE setting_key = 'simplified_workflow';
  
  IF workflow_enabled THEN
    RAISE NOTICE '✅ Workflow simplificado ativado com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Falha ao ativar workflow simplificado';
  END IF;
END $$;