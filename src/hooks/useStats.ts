import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      
      return {
        modelsCount: data?.models_count || 0,
        categoriesCount: data?.categories_count || 0,
        optionsCount: data?.options_count || 0,
        quotationsCount: data?.quotations_count || 0,
        usersCount: data?.users_count || 0,
        contractsCount: data?.contracts_count || 0
      };
    },
    staleTime: 30000, // Cache por 30 segundos
  });
};
