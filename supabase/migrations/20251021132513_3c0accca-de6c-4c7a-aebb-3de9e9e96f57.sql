-- Atualizar a password do utilizador diretamente
UPDATE auth.users
SET 
  encrypted_password = crypt('Okean#br101', gen_salt('bf')),
  updated_at = now()
WHERE id = '237c5317-2496-41eb-b24a-337f9c966237';