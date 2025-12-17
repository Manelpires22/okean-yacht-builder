-- Drop the global unique constraint on code
ALTER TABLE public.options DROP CONSTRAINT IF EXISTS options_code_key;

-- Create a new unique constraint per yacht model (code must be unique within each model)
ALTER TABLE public.options ADD CONSTRAINT options_yacht_model_code_key UNIQUE (yacht_model_id, code);