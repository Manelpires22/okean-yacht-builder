import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useApproveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // 1. Atualizar status da cotação para 'approved'
      const { data: updatedQuotation, error: updateError } = await supabase
        .from("quotations")
        .update({ status: "approved" })
        .eq("id", quotationId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 2. Criar contrato automaticamente
      const { data: contract, error: contractError } = await supabase.functions.invoke(
        "create-contract-from-quotation",
        {
          body: { quotation_id: quotationId },
        }
      );

      if (contractError) throw contractError;

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
