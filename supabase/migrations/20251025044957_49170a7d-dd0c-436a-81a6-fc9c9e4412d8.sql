-- Remove qualquer foreign key circular problemática na tabela users
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%users_id_fkey%'
    LOOP
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);
    END LOOP;
END $$;

-- Garantir que auth.users tem ON DELETE CASCADE para users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;