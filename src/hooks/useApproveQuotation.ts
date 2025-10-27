import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useApproveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      console.log('[useApproveQuotation] Starting approval for quotation:', quotationId);

      // 1. Atualizar status da cotação para 'approved'
      const { data: updatedQuotation, error: updateError } = await supabase
        .from("quotations")
        .update({ status: "approved" })
        .eq("id", quotationId)
        .select()
        .single();

      if (updateError) {
        console.error('[useApproveQuotation] Error updating status:', updateError);
        throw updateError;
      }

      console.log('[useApproveQuotation] Status updated to approved, creating contract...');

      // 2. Criar contrato automaticamente
      const { data: contract, error: contractError } = await supabase.functions.invoke(
        "create-contract-from-quotation",
        {
          body: { quotation_id: quotationId },
        }
      );

      if (contractError) {
        console.error('[useApproveQuotation] Error creating contract:', contractError);
        throw contractError;
      }

      console.log('[useApproveQuotation] Contract created successfully:', contract?.contract?.id);

      // 3. Registrar log de auditoria
      await supabase.from("audit_logs").insert({
        action: "APPROVE_QUOTATION",
        table_name: "quotations",
        record_id: quotationId,
        metadata: {
          status: "approved",
          contract_created: contract?.contract?.id,
        },
      });

      console.log('[useApproveQuotation] Approval process completed successfully');

      return { quotation: updatedQuotation, contract: contract?.contract };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["quotation-contract"] });
      
      toast.success("Cotação aprovada com sucesso!", {
        description: `Contrato ${data.contract?.contract_number} criado automaticamente.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Erro ao aprovar cotação", {
        description: error.message,
      });
    },
  });
}
