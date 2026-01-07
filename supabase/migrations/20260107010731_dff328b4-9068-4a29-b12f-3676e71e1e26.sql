-- ============================================
-- FASE 1: CORREÇÕES CRÍTICAS
-- ============================================

-- 1.1 Remover privilege escalation em user_roles
DROP POLICY IF EXISTS "user_roles_insert_owner" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_owner" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_owner" ON user_roles;

-- 1.2 Remover função is_admin(uuid) incorreta
DROP FUNCTION IF EXISTS is_admin(uuid);

-- ============================================
-- FASE 2: PROTEGER DADOS PESSOAIS
-- ============================================

-- 2.1 Bloquear acesso anônimo a clientes
DROP POLICY IF EXISTS "Allow public access to clients for public quotations" ON clients;

-- 2.2 Bloquear acesso anônimo a usuários
DROP POLICY IF EXISTS "Allow public access to users for public quotations" ON users;

-- 2.3 Bloquear acesso anônimo a memorial_items
DROP POLICY IF EXISTS "Allow public access to memorial_items for public quotations" ON memorial_items;

-- ============================================
-- FASE 3: PROTEGER ESTRATÉGIA COMERCIAL
-- ============================================

-- 3.1 Restringir yacht_models
DROP POLICY IF EXISTS "Allow public access to yacht_models for public quotations" ON yacht_models;

-- 3.2 Restringir options
DROP POLICY IF EXISTS "Allow public access to options for public quotations" ON options;

-- 3.3 Restringir memorial_categories
DROP POLICY IF EXISTS "Allow public access to memorial_categories for public quotation" ON memorial_categories;

-- 3.4 Restringir quotation_options
DROP POLICY IF EXISTS "Allow public access to quotation_options for public quotations" ON quotation_options;

-- 3.5 Restringir quotation_upgrades
DROP POLICY IF EXISTS "Allow public access to quotation_upgrades for public quotations" ON quotation_upgrades;

-- 3.6 Restringir memorial_upgrades
DROP POLICY IF EXISTS "Allow public access to memorial_upgrades for public quotations" ON memorial_upgrades;

-- ============================================
-- FASE 4: CORREÇÕES DE FUNÇÃO
-- ============================================

-- 4.1 Corrigir set_updated_at com SECURITY DEFINER e search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;