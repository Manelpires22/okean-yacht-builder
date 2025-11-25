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
      
      // Extrair opcionais de selected_options (campo correto do snapshot)
      const options = baseSnapshot?.selected_options?.map((so: any) => ({
        id: so.option_id || so.option?.id,
        name: so.option?.name,
        code: so.option?.code,
        description: so.option?.description,
        base_price: so.unit_price,
        unit_price: so.unit_price,
        quantity: so.quantity,
        delivery_days_impact: so.delivery_days_impact,
        ...so.option
      })) || [];
      
      // Buscar memorial items da tabela usando yacht_model_id
      const { data: memorialItems, error: memorialError } = await supabase
        .from("memorial_items")
        .select(`
          *,
          category:memorial_categories(*)
        `)
        .eq("yacht_model_id", contract.yacht_model_id)
        .eq("is_active", true)
        .order("category_display_order")
        .order("display_order");

      if (memorialError) throw memorialError;

      return {
        contract,
        options,
        memorialItems,
      };
    },
    enabled: !!contractId,
  });
}
