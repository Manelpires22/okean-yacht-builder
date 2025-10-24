-- Remover módulo Memorial OKEAN completo do Supabase

-- 1. Dropar funções RPC relacionadas ao memorial_okean
DROP FUNCTION IF EXISTS public.update_memorial_category_orders(text, jsonb);
DROP FUNCTION IF EXISTS public.rename_memorial_category(text, text, text);
DROP FUNCTION IF EXISTS public.merge_memorial_categories(text, text, text);
DROP FUNCTION IF EXISTS public.delete_empty_memorial_category(text, text);
DROP FUNCTION IF EXISTS public.get_distinct_memorial_modelos();

-- 2. Dropar tabela memorial_okean
DROP TABLE IF EXISTS public.memorial_okean CASCADE;

-- Nota: normalize_memorial_category() e get_yacht_model_id() são mantidas 
-- pois ainda são úteis para memorial_items