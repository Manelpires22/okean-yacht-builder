-- Fase 1: PRIMEIRO dropar a FK existente
ALTER TABLE options DROP CONSTRAINT IF EXISTS options_category_id_fkey;

-- Fase 2: Inserir categorias de opcionais em memorial_categories (se não existirem)
INSERT INTO memorial_categories (value, label, description, display_order, is_active)
SELECT 
  LOWER(REPLACE(REPLACE(name, ' ', '_'), '&', 'e')) as value,
  name as label,
  description,
  display_order + 100,
  is_active
FROM option_categories oc
WHERE NOT EXISTS (
  SELECT 1 FROM memorial_categories mc 
  WHERE LOWER(mc.label) = LOWER(oc.name)
);

-- Fase 3: Mapear options existentes para memorial_categories
UPDATE options o
SET category_id = (
  SELECT mc.id 
  FROM memorial_categories mc 
  JOIN option_categories oc ON LOWER(mc.label) = LOWER(oc.name)
  WHERE oc.id = o.category_id
)
WHERE o.category_id IN (SELECT id FROM option_categories);

-- Fase 4: Criar nova FK para memorial_categories
ALTER TABLE options ADD CONSTRAINT options_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES memorial_categories(id);

-- Fase 5: Marcar option_categories como deprecated
ALTER TABLE option_categories ADD COLUMN IF NOT EXISTS deprecated_at timestamptz;
UPDATE option_categories SET deprecated_at = now() WHERE deprecated_at IS NULL;