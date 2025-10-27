import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ATOConfiguration {
  id: string;
  ato_id: string;
  item_id: string;
  item_type: "option" | "memorial_item";
  configuration_details: any;
  sub_items: any[];
  notes: string | null;
  created_at: string;
  created_by: string | null;
  
  // Relacionamentos
  options?: any;
  memorial_items?: any;
}

export function useATOConfigurations(atoId: string | undefined) {
  return useQuery({
    queryKey: ["ato-configurations", atoId],
    queryFn: async () => {
      if (!atoId) throw new Error("ATO ID is required");

      const { data, error } = await supabase
        .from("ato_configurations")
        .select(`
          *,
          options (*),
          memorial_items (*)
        `)
        .eq("ato_id", atoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ATOConfiguration[];
    },
    enabled: !!atoId,
  });
}

export function useAddATOConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ato_id: string;
      item_id: string;
      item_type: "option" | "memorial_item";
      configuration_details?: any;
      sub_items?: any[];
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("ato_configurations")
        .insert({
          ato_id: data.ato_id,
          item_id: data.item_id,
          item_type: data.item_type,
          configuration_details: data.configuration_details || {},
          sub_items: data.sub_items || [],
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ato-configurations", variables.ato_id] });
      toast.success("Item adicionado à ATO com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error adding ATO configuration:", error);
      toast.error("Erro ao adicionar item à ATO");
    },
  });
}

export function useRemoveATOConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ configId, atoId }: { configId: string; atoId: string }) => {
      const { error } = await supabase
        .from("ato_configurations")
        .delete()
        .eq("id", configId);

      if (error) throw error;
      return { configId, atoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ato-configurations", data.atoId] });
      toast.success("Item removido da ATO");
    },
    onError: (error: Error) => {
      console.error("Error removing ATO configuration:", error);
      toast.error("Erro ao remover item da ATO");
    },
  });
}
