-- Inserir dados do utilizador na tabela users
INSERT INTO public.users (
  id,
  email,
  full_name,
  department,
  is_active,
  created_at,
  updated_at
) VALUES (
  '237c5317-2496-41eb-b24a-337f9c966237',
  'manuel.pires@okeanyachts.com',
  'Manuel Macieira Pires',
  'Comercial',
  true,
  NOW(),
  NOW()
);