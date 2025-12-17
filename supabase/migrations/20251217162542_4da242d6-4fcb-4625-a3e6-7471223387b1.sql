-- Adicionar campos de imagem nas tabelas que não têm

-- memorial_items
ALTER TABLE memorial_items ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE memorial_items ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- memorial_upgrades
ALTER TABLE memorial_upgrades ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE memorial_upgrades ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- options (já tem image_url, adicionar apenas images)
ALTER TABLE options ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;