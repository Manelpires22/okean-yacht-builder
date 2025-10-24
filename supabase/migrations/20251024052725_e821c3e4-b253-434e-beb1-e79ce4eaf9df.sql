-- Criar função RPC para retornar modelos distintos da tabela memorial_okean
-- Resolve problema de limite de 1000 registros do Supabase
CREATE OR REPLACE FUNCTION get_distinct_memorial_modelos()
RETURNS TABLE (modelo text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT memorial_okean.modelo
  FROM memorial_okean
  ORDER BY memorial_okean.modelo;
$$;