import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'administrador' | 'gerente_comercial' | 'vendedor' | 'engenheiro';

export const useUserRole = () => {
  return useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { roles: [], isAdmin: false };

      const { data: roles } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id);

      const userRoles = (roles as any)?.map((r: any) => r.role as AppRole) || [];
      const isAdmin = userRoles.includes('administrador');

      return { roles: userRoles, isAdmin };
    }
  });
};
