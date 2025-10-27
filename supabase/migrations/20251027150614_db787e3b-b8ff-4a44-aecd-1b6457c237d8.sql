-- ==============================================
-- FASE 2: Sistema de Permissões Editáveis
-- ==============================================

-- 1. Criar tabela de configuração de permissões
CREATE TABLE role_permissions_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission text NOT NULL,
  is_granted boolean DEFAULT true NOT NULL,
  is_default boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (role, permission)
);

-- 2. Habilitar RLS
ALTER TABLE role_permissions_config ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Admins can manage role permissions"
  ON role_permissions_config FOR ALL
  USING (has_role(auth.uid(), 'administrador'))
  WITH CHECK (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Everyone can view role permissions"
  ON role_permissions_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 4. Trigger para atualizar updated_at
CREATE TRIGGER update_role_permissions_config_updated_at
  BEFORE UPDATE ON role_permissions_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Trigger de auditoria
CREATE TRIGGER audit_role_permissions_config
  AFTER INSERT OR UPDATE OR DELETE ON role_permissions_config
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_func();

-- 6. Índices para performance
CREATE INDEX idx_role_permissions_config_role ON role_permissions_config(role);
CREATE INDEX idx_role_permissions_config_permission ON role_permissions_config(permission);

-- 7. Função para obter permissões efetivas de um usuário
CREATE OR REPLACE FUNCTION get_effective_permissions(_user_id uuid)
RETURNS TABLE (permission text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.permission
  FROM role_permissions_config p
  WHERE p.role IN (
    SELECT ur.role 
    FROM user_roles ur 
    WHERE ur.user_id = _user_id
  )
  AND p.is_granted = true
  
  UNION
  
  -- Se tem admin:full_access, retornar todas as permissões
  SELECT DISTINCT rpc.permission
  FROM role_permissions_config rpc
  WHERE EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions_config admin_perm 
      ON admin_perm.role = ur.role
    WHERE ur.user_id = _user_id
      AND admin_perm.permission = 'admin:full_access'
      AND admin_perm.is_granted = true
  );
$$;

-- 8. Função para resetar permissões para padrão
CREATE OR REPLACE FUNCTION reset_role_permissions_to_default(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar todas as permissões customizadas desta role
  DELETE FROM role_permissions_config
  WHERE role = _role AND is_default = false;
  
  -- Restaurar is_default = true para as que sobraram
  UPDATE role_permissions_config
  SET is_default = true, updated_at = now()
  WHERE role = _role;
END;
$$;

-- 9. Popular tabela com permissões padrão

-- Administrador
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES ('administrador', 'admin:full_access', true, true);

-- Diretor Comercial
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('diretor_comercial', 'quotations:view_all', true, true),
  ('diretor_comercial', 'quotations:create', true, true),
  ('diretor_comercial', 'quotations:edit_all', true, true),
  ('diretor_comercial', 'quotations:approve', true, true),
  ('diretor_comercial', 'quotations:send', true, true),
  ('diretor_comercial', 'clients:view', true, true),
  ('diretor_comercial', 'clients:create', true, true),
  ('diretor_comercial', 'clients:edit', true, true),
  ('diretor_comercial', 'clients:delete', true, true),
  ('diretor_comercial', 'approvals:view', true, true),
  ('diretor_comercial', 'approvals:review', true, true),
  ('diretor_comercial', 'approvals:approve_discount', true, true),
  ('diretor_comercial', 'options:view', true, true),
  ('diretor_comercial', 'yacht_models:view', true, true),
  ('diretor_comercial', 'memorial:view', true, true),
  ('diretor_comercial', 'users:view', true, true);

-- Gerente Comercial
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('gerente_comercial', 'quotations:view_all', true, true),
  ('gerente_comercial', 'quotations:create', true, true),
  ('gerente_comercial', 'quotations:edit_all', true, true),
  ('gerente_comercial', 'quotations:approve', true, true),
  ('gerente_comercial', 'quotations:send', true, true),
  ('gerente_comercial', 'clients:view', true, true),
  ('gerente_comercial', 'clients:create', true, true),
  ('gerente_comercial', 'clients:edit', true, true),
  ('gerente_comercial', 'approvals:view', true, true),
  ('gerente_comercial', 'approvals:review', true, true),
  ('gerente_comercial', 'approvals:approve_discount', true, true),
  ('gerente_comercial', 'options:view', true, true),
  ('gerente_comercial', 'options:create', true, true),
  ('gerente_comercial', 'options:edit', true, true),
  ('gerente_comercial', 'yacht_models:view', true, true),
  ('gerente_comercial', 'yacht_models:create', true, true),
  ('gerente_comercial', 'yacht_models:edit', true, true),
  ('gerente_comercial', 'memorial:view', true, true),
  ('gerente_comercial', 'memorial:edit', true, true),
  ('gerente_comercial', 'users:view', true, true);

-- Comercial (Vendedor)
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('comercial', 'quotations:view_own', true, true),
  ('comercial', 'quotations:create', true, true),
  ('comercial', 'quotations:edit_own', true, true),
  ('comercial', 'clients:view', true, true),
  ('comercial', 'clients:create', true, true),
  ('comercial', 'clients:edit', true, true),
  ('comercial', 'options:view', true, true),
  ('comercial', 'yacht_models:view', true, true),
  ('comercial', 'memorial:view', true, true);

-- Broker
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('broker', 'quotations:view_own', true, true),
  ('broker', 'quotations:create', true, true),
  ('broker', 'quotations:edit_own', true, true),
  ('broker', 'clients:view', true, true),
  ('broker', 'clients:create', true, true),
  ('broker', 'clients:edit', true, true),
  ('broker', 'options:view', true, true),
  ('broker', 'yacht_models:view', true, true),
  ('broker', 'memorial:view', true, true);

-- Backoffice Comercial
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('backoffice_comercial', 'quotations:view_all', true, true),
  ('backoffice_comercial', 'quotations:send', true, true),
  ('backoffice_comercial', 'clients:view', true, true),
  ('backoffice_comercial', 'clients:create', true, true),
  ('backoffice_comercial', 'clients:edit', true, true),
  ('backoffice_comercial', 'options:view', true, true),
  ('backoffice_comercial', 'yacht_models:view', true, true),
  ('backoffice_comercial', 'memorial:view', true, true);

-- PM Engenharia
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('pm_engenharia', 'quotations:view_assigned', true, true),
  ('pm_engenharia', 'customizations:view', true, true),
  ('pm_engenharia', 'customizations:review', true, true),
  ('pm_engenharia', 'customizations:approve', true, true),
  ('pm_engenharia', 'workflow:manage', true, true),
  ('pm_engenharia', 'options:view', true, true),
  ('pm_engenharia', 'yacht_models:view', true, true),
  ('pm_engenharia', 'memorial:view', true, true),
  ('pm_engenharia', 'memorial:edit', true, true);

-- Comprador
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('comprador', 'quotations:view_assigned', true, true),
  ('comprador', 'customizations:view', true, true),
  ('comprador', 'workflow:supply', true, true),
  ('comprador', 'options:view', true, true),
  ('comprador', 'memorial:view', true, true);

-- Planejador
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('planejador', 'quotations:view_assigned', true, true),
  ('planejador', 'customizations:view', true, true),
  ('planejador', 'workflow:planning', true, true),
  ('planejador', 'options:view', true, true),
  ('planejador', 'yacht_models:view', true, true),
  ('planejador', 'memorial:view', true, true);

-- Produção
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('producao', 'quotations:view_approved', true, true),
  ('producao', 'customizations:view', true, true),
  ('producao', 'options:view', true, true),
  ('producao', 'yacht_models:view', true, true),
  ('producao', 'memorial:view', true, true);

-- Financeiro
INSERT INTO role_permissions_config (role, permission, is_granted, is_default)
VALUES
  ('financeiro', 'quotations:view_all', true, true),
  ('financeiro', 'clients:view', true, true),
  ('financeiro', 'options:view', true, true),
  ('financeiro', 'yacht_models:view', true, true);