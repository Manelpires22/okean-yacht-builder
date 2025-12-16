import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOptions(categoryId?: string, yachtModelId?: string) {
  return useQuery({
    queryKey: ["options-v2", categoryId, yachtModelId],
    queryFn: async () => {
      let query = supabase
        .from("options")
        .select(`
          *,
          category:option_categories(id, name),
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

export function useOptionCategories() {
  return useQuery({
    queryKey: ["option-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("option_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });
}
