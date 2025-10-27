-- Adicionar campo display_order à tabela yacht_models
ALTER TABLE yacht_models 
ADD COLUMN display_order integer DEFAULT 999;

-- Inicializar display_order com valores sequenciais baseados no código
WITH numbered_models AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY code) as rn
  FROM yacht_models
)
UPDATE yacht_models
SET display_order = numbered_models.rn
FROM numbered_models
WHERE yacht_models.id = numbered_models.id;

-- Criar função para atualizar ordem de múltiplos modelos
CREATE OR REPLACE FUNCTION update_yacht_models_order(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_item jsonb;
BEGIN
  FOR update_item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE yacht_models
    SET 
      display_order = (update_item->>'display_order')::integer,
      updated_at = now()
    WHERE id = (update_item->>'id')::uuid;
  END LOOP;
END;
$$;

-- Comentário sobre a função
COMMENT ON FUNCTION update_yacht_models_order IS 'Atualiza a ordem de exibição de múltiplos modelos de iates de uma só vez';
