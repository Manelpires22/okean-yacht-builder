import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOptions(categoryId?: string) {
  return useQuery({
    queryKey: ["options", categoryId],
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
