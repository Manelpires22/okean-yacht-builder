-- Limpar registros órfãos na tabela users que não têm correspondente em auth.users
DELETE FROM public.users 
WHERE id NOT IN (
  SELECT id FROM auth.users
);