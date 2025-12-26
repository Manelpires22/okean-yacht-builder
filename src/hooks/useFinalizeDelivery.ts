import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FinalizeDeliveryParams {
  contractId: string;
  deliveryNotes?: string;
}

/**
 * Hook para finalizar entrega do barco
 * Valida que 100% dos itens foram verificados antes de permitir
 */
export function useFinalizeDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, deliveryNotes }: FinalizeDeliveryParams) => {
      // Verificar se todos os itens verificáveis foram verificados
      // Filtrar ato_item - são apenas agrupadores, não verificáveis
      const { data: items, error: checkError } = await supabase
        .from("contract_delivery_checklist")
        .select("is_verified, item_type")
        .eq("contract_id", contractId)
        .neq("item_type", "ato_item");

      if (checkError) throw checkError;

      const allVerified = items?.every((item) => item.is_verified);
      if (!allVerified) {
        throw new Error("Todos os itens precisam ser verificados antes de finalizar a entrega");
      }

      // Atualizar status do contrato
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("contracts")
        .update({
          delivery_status: "delivered",
          delivered_at: new Date().toISOString(),
          delivered_by: user?.id,
          delivery_notes: deliveryNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contract", variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("🎉 Entrega do barco finalizada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error finalizing delivery:", error);
      toast.error(error.message || "Erro ao finalizar entrega");
    },
  });
}
