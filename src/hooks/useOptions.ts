import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOptions(categoryId?: string, yachtModelId?: string) {
  return useQuery({
    queryKey: ["options", categoryId, yachtModelId],
    queryFn: async () => {
      let query = supabase
        .from("options")
        .select("*, category:option_categories(id, name)")
        .eq("is_active", true);
      
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query.order("name");
      
      if (error) throw error;

      // If yachtModelId is provided, filter options by compatibility
      if (yachtModelId && data) {
        const { data: compatibleOptions, error: compatError } = await supabase
          .from("option_yacht_models")
          .select("option_id")
          .eq("yacht_model_id", yachtModelId);
        
        if (compatError) throw compatError;
        
        const compatibleOptionIds = new Set(
          compatibleOptions?.map((rel) => rel.option_id) || []
        );

        // Only return options that are compatible with the yacht model
        // If an option has no yacht_models assigned, show it anyway (backward compatibility)
        const filteredData = await Promise.all(
          data.map(async (option) => {
            const { count } = await supabase
              .from("option_yacht_models")
              .select("*", { count: "exact", head: true })
              .eq("option_id", option.id);
            
            // Show if: no models assigned (count === 0) OR is compatible
            return count === 0 || compatibleOptionIds.has(option.id) ? option : null;
          })
        );

        return filteredData.filter((opt) => opt !== null);
      }

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
