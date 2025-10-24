-- Create Memorial_Okean table
CREATE TABLE IF NOT EXISTS public.memorial_okean (
  id SERIAL PRIMARY KEY,
  modelo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao_item TEXT NOT NULL,
  tipo_item TEXT NOT NULL DEFAULT 'Padrão',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for filtering
CREATE INDEX idx_memorial_okean_modelo ON public.memorial_okean(modelo);
CREATE INDEX idx_memorial_okean_categoria ON public.memorial_okean(categoria);
CREATE INDEX idx_memorial_okean_modelo_categoria ON public.memorial_okean(modelo, categoria);

-- Enable RLS
ALTER TABLE public.memorial_okean ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read memorial items
CREATE POLICY "Anyone can view memorial items"
  ON public.memorial_okean
  FOR SELECT
  USING (true);

-- Only admins can manage memorial items
CREATE POLICY "Admins can manage memorial items"
  ON public.memorial_okean
  FOR ALL
  USING (has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));