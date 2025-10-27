-- Corrigir função update_yacht_models_order para ter search_path seguro
DROP FUNCTION IF EXISTS update_yacht_models_order(jsonb);

CREATE OR REPLACE FUNCTION update_yacht_models_order(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMENT ON FUNCTION update_yacht_models_order IS 'Atualiza a ordem de exibição de múltiplos modelos de iates de uma só vez';
