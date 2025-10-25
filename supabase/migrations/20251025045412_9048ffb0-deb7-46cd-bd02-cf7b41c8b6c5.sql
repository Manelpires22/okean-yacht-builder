-- Deletar o registro órfão específico
DELETE FROM public.users WHERE email = 'ivan.teixeira@okeanyachts.com';

-- Desabilitar o trigger handle_new_user para evitar inserções automáticas duplicadas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;