-- Forçar a exclusão completa do usuário ivan.teixeira via SQL no auth.users
-- Isso requer acesso direto, então vamos ao menos garantir que public.users está limpo
DELETE FROM public.users WHERE email ILIKE '%ivan.teixeira%';
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM public.users WHERE email ILIKE '%ivan.teixeira%'
);