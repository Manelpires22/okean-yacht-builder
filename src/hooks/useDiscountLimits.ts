import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DiscountLimitConfig {
  id: string;
  limit_type: 'base' | 'options';
  no_approval_max: number;
  director_approval_max: number;
  admin_approval_required_above: number;
  updated_by: string | null;
  updated_at: string;
}

export interface UpdateDiscountLimitInput {
  limit_type: 'base' | 'options';
  no_approval_max: number;
  director_approval_max: number;
  admin_approval_required_above: number;
}

export function useDiscountLimits() {
  return useQuery({
    queryKey: ['discount-limits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_limits_config' as any)
        .select('*')
        .order('limit_type');
      
      if (error) throw error;
      return data as unknown as DiscountLimitConfig[];
    }
  });
}

export function useUpdateDiscountLimit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateDiscountLimitInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('discount_limits_config' as any)
        .update({
          no_approval_max: input.no_approval_max,
          director_approval_max: input.director_approval_max,
          admin_approval_required_above: input.admin_approval_required_above,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('limit_type', input.limit_type)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-limits'] });
      toast.success('Limites de desconto atualizados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar limites', {
        description: error.message
      });
    }
  });
}
