import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemorialCategories } from "./useMemorialCategories";

export function useOptions(categoryId?: string, yachtModelId?: string) {
  return useQuery({
    queryKey: ["options-v2", categoryId, yachtModelId],
    queryFn: async () => {
      let query = supabase
        .from("options")
        .select(`
          *,
          category:memorial_categories!options_category_id_fkey(id, label, value),
          job_stop:job_stops!options_job_stop_id_fkey(id, stage, days_limit, item_name)
        `)
        .eq("is_active", true);
      
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      // Filter by yacht model - all options are now model-specific
      if (yachtModelId) {
        query = query.eq("yacht_model_id", yachtModelId);
      }

      const { data, error } = await query.order("name");
      
      if (error) throw error;
      return data;
    },
  });
}

/**
 * @deprecated Use useMemorialCategories instead. 
 * Options now use memorial_categories as the single source of truth.
 */
export function useOptionCategories() {
  console.warn('useOptionCategories is deprecated. Use useMemorialCategories instead.');
  return useMemorialCategories();
}
