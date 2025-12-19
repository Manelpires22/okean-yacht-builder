-- Adicionar campos para imagens categorizadas (externas e internas)
ALTER TABLE yacht_models 
  ADD COLUMN IF NOT EXISTS exterior_images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS interior_images JSONB DEFAULT '[]'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN yacht_models.exterior_images IS 'Array de URLs de fotos externas do iate';
COMMENT ON COLUMN yacht_models.interior_images IS 'Array de URLs de fotos internas do iate';

-- Migrar imagens existentes da gallery_images para exterior_images (assumindo que são externas)
UPDATE yacht_models 
SET exterior_images = gallery_images 
WHERE gallery_images IS NOT NULL AND gallery_images != '[]'::jsonb;