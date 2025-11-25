import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContractItems(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract-items", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select(`
          id,
          base_snapshot,
          yacht_model_id,
          yacht_models (
            id,
            name,
            code
          )
        `)
        .eq("id", contractId)
        .single();

      if (contractError) throw contractError;

      // Parsear base_snapshot para extrair itens
      const baseSnapshot = contract.base_snapshot as any;
      
      // Extrair opcionais do snapshot
      const options = baseSnapshot?.options || [];
      
      // Extrair memorial items do snapshot
      const memorialItems = baseSnapshot?.memorial_items || [];

      return {
        contract,
        options,
        memorialItems,
      };
    },
    enabled: !!contractId,
  });
}
