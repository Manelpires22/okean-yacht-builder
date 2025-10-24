-- Corrigir função get_yacht_model_id para buscar exatamente
DROP FUNCTION IF EXISTS get_yacht_model_id(TEXT);

CREATE OR REPLACE FUNCTION get_yacht_model_id(modelo_text TEXT)
RETURNS UUID AS $$
DECLARE
  model_id UUID;
BEGIN
  -- Buscar exatamente por código (case-insensitive)
  SELECT id INTO model_id
  FROM yacht_models
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(modelo_text))
  LIMIT 1;
  
  -- Se não encontrou, buscar removendo espaços
  IF model_id IS NULL THEN
    SELECT id INTO model_id
    FROM yacht_models
    WHERE REPLACE(UPPER(code), ' ', '') = REPLACE(UPPER(TRIM(modelo_text)), ' ', '')
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrou, buscar no nome
  IF model_id IS NULL THEN
    SELECT id INTO model_id
    FROM yacht_models
    WHERE UPPER(name) ILIKE '%' || UPPER(TRIM(modelo_text)) || '%'
    LIMIT 1;
  END IF;
  
  IF model_id IS NULL THEN
    RAISE EXCEPTION 'Modelo não encontrado: %', modelo_text;
  END IF;
  
  RETURN model_id;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;