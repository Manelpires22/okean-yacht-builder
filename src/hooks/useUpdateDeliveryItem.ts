import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateDeliveryItemParams {
  itemId: string;
  isVerified: boolean;
  verificationNotes?: string;
}

/**
 * Hook para atualizar status de verificação de um item do checklist
 */
export function useUpdateDeliveryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isVerified, verificationNotes }: UpdateDeliveryItemParams) => {
      const updateData: any = {
        is_verified: isVerified,
        verification_notes: verificationNotes || null,
        updated_at: new Date().toISOString(),
      };

      // Se está sendo verificado, adicionar dados do verificador
      if (isVerified) {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user?.id;
      } else {
        // Se está sendo desmarcado, limpar dados de verificação
        updateData.verified_at = null;
        updateData.verified_by = null;
      }

      const { data, error } = await supabase
        .from("contract_delivery_checklist")
        .update(updateData)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["contract-delivery-checklist", data.contract_id] 
      });
      toast.success(
        data.is_verified 
          ? "Item marcado como verificado" 
          : "Verificação removida"
      );
    },
    onError: (error: Error) => {
      console.error("Error updating delivery item:", error);
      toast.error("Erro ao atualizar item: " + error.message);
    },
  });
}
