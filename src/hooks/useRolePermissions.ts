import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppRole, Permission } from "@/lib/role-permissions";

export interface RolePermissionConfig {
  id: string;
  role: AppRole;
  permission: Permission;
  is_granted: boolean;
  is_default: boolean;
  updated_at: string;
  updated_by?: string;
}

/**
 * Fetches all role permissions from database
 */
export function useRolePermissions() {
  return useQuery({
    queryKey: ['role-permissions-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions_config' as any)
        .select('*')
        .order('role', { ascending: true });
      
      if (error) throw error;
      return data as unknown as RolePermissionConfig[];
    },
  });
}

/**
 * Toggles a permission for a specific role
 */
export function useToggleRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      role, 
      permission, 
      currentState 
    }: { 
      role: AppRole; 
      permission: Permission; 
      currentState: boolean 
    }) => {
      const newState = !currentState;

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('role_permissions_config' as any)
        .select('id')
        .eq('role', role)
        .eq('permission', permission)
        .maybeSingle();

      if (existing) {
        // UPDATE
        const { error } = await supabase
          .from('role_permissions_config' as any)
          .update({ 
            is_granted: newState, 
            is_default: false,
            updated_at: new Date().toISOString() 
          })
          .eq('role', role)
          .eq('permission', permission);

        if (error) throw error;
      } else {
        // INSERT (nova permissão customizada)
        const { error } = await supabase
          .from('role_permissions_config' as any)
          .insert({
            role,
            permission,
            is_granted: newState,
            is_default: false
          });

        if (error) throw error;
      }

      return { role, permission, newState };
    },
    onSuccess: ({ role, permission, newState }) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions-config'] });
      toast.success(
        `Permissão "${permission}" ${newState ? 'concedida' : 'removida'} para "${role}"`
      );
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar permissão', {
        description: error.message
      });
    }
  });
}

/**
 * Reset role permissions to default values
 */
export function useResetRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: AppRole) => {
      const { error } = await supabase.rpc('reset_role_permissions_to_default' as any, {
        _role: role
      });
      if (error) throw error;
    },
    onSuccess: (_, role) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions-config'] });
      toast.success(`Permissões de "${role}" resetadas para padrão`);
    },
    onError: (error: Error) => {
      toast.error('Erro ao resetar permissões', {
        description: error.message
      });
    }
  });
}

/**
 * Gets permissions for a specific role from database
 */
export function getRolePermissionsFromDB(
  allPermissions: RolePermissionConfig[],
  role: AppRole
): Permission[] {
  return allPermissions
    .filter(p => p.role === role && p.is_granted)
    .map(p => p.permission as Permission);
}

/**
 * Checks if a role has a specific permission (from DB)
 */
export function hasPermissionInDB(
  allPermissions: RolePermissionConfig[],
  role: AppRole,
  permission: Permission
): boolean {
  // Admin tem todas
  const adminPerm = allPermissions.find(
    p => p.role === role && p.permission === 'admin:full_access' && p.is_granted
  );
  if (adminPerm) return true;

  // Verificar permissão específica
  const perm = allPermissions.find(
    p => p.role === role && p.permission === permission
  );
  
  return perm?.is_granted ?? false;
}

/**
 * Checks if a permission has been customized (not default)
 */
export function isPermissionCustomized(
  allPermissions: RolePermissionConfig[],
  role: AppRole,
  permission: Permission
): boolean {
  const perm = allPermissions.find(
    p => p.role === role && p.permission === permission
  );
  return perm ? !perm.is_default : false;
}
