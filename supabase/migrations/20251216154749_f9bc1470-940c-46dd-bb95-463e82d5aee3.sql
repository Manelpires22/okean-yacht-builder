-- Remove duplicate foreign keys that are causing JOIN conflicts in Supabase PostgREST
-- The original FKs (memorial_items_job_stop_id_fkey and options_job_stop_id_fkey) should be kept

-- Remove duplicate FK from memorial_items
ALTER TABLE memorial_items 
DROP CONSTRAINT IF EXISTS fk_memorial_items_job_stop;

-- Remove duplicate FK from options
ALTER TABLE options 
DROP CONSTRAINT IF EXISTS fk_options_job_stop;