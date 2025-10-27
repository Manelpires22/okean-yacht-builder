import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface YachtModelOrderUpdate {
  id: string;
  display_order: number;
}

export function useUpdateYachtModelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: YachtModelOrderUpdate[]) => {
      const { error } = await supabase.rpc("update_yacht_models_order", {
        updates: updates as any,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yacht-models"] });
      queryClient.invalidateQueries({ queryKey: ["admin-yacht-models"] });
      toast.success("Ordem dos modelos atualizada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error updating yacht model order:", error);
      toast.error("Erro ao atualizar ordem dos modelos");
    },
  });
}
