import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOptionYachtModels(optionId?: string) {
  return useQuery({
    queryKey: ["option-yacht-models", optionId],
    queryFn: async () => {
      if (!optionId) return [];
      
      const { data, error } = await supabase
        .from("option_yacht_models")
        .select("yacht_model_id, yacht_model:yacht_models(id, name, code)")
        .eq("option_id", optionId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!optionId,
  });
}

export function useAllYachtModels() {
  return useQuery({
    queryKey: ["yacht-models-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yacht_models")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
}
