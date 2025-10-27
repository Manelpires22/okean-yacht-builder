import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useYachtModels() {
  return useQuery({
    queryKey: ["yacht-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yacht_models")
        .select("*")
        .eq("is_active", true)
        .order("display_order")
        .order("code");
      
      if (error) throw error;
      return data;
    },
  });
}
