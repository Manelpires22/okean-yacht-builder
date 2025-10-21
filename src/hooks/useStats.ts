import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [models, categories, options, quotations, users] = await Promise.all([
        supabase.from('yacht_models').select('*', { count: 'exact', head: true }),
        supabase.from('option_categories').select('*', { count: 'exact', head: true }),
        supabase.from('options').select('*', { count: 'exact', head: true }),
        supabase.from('quotations').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true })
      ]);
      
      return {
        modelsCount: models.count || 0,
        categoriesCount: categories.count || 0,
        optionsCount: options.count || 0,
        quotationsCount: quotations.count || 0,
        usersCount: users.count || 0
      };
    }
  });
};
