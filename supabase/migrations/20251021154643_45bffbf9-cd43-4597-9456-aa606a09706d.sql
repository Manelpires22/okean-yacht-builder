-- Create table to relate options with yacht models (which models each option can be applied to)
CREATE TABLE public.option_yacht_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES public.options(id) ON DELETE CASCADE,
  yacht_model_id UUID NOT NULL REFERENCES public.yacht_models(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(option_id, yacht_model_id)
);

-- Enable RLS
ALTER TABLE public.option_yacht_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view option-model relationships for active options and models
CREATE POLICY "Anyone can view option-model relationships"
ON public.option_yacht_models
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.options 
    WHERE options.id = option_yacht_models.option_id 
    AND options.is_active = true
  )
  AND EXISTS (
    SELECT 1 FROM public.yacht_models 
    WHERE yacht_models.id = option_yacht_models.yacht_model_id 
    AND yacht_models.is_active = true
  )
);

-- Admins and commercial managers can manage option-model relationships
CREATE POLICY "Admins can manage option-model relationships"
ON public.option_yacht_models
FOR ALL
USING (
  has_role(auth.uid(), 'administrador'::app_role) 
  OR has_role(auth.uid(), 'gerente_comercial'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'administrador'::app_role) 
  OR has_role(auth.uid(), 'gerente_comercial'::app_role)
);

-- Create index for better performance
CREATE INDEX idx_option_yacht_models_option_id ON public.option_yacht_models(option_id);
CREATE INDEX idx_option_yacht_models_yacht_model_id ON public.option_yacht_models(yacht_model_id);

-- Add comment
COMMENT ON TABLE public.option_yacht_models IS 'Defines which options are compatible with which yacht models';