import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConsolidatedContractScope(contractId: string | undefined) {
  return useQuery({
    queryKey: ["consolidated-contract-scope", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      // 1. Buscar contrato com snapshot
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

      const baseSnapshot = contract.base_snapshot as any;

      // 2. Buscar memorial items do modelo
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

      // 3. Buscar ATOs aprovadas
      const { data: approvedATOs, error: atosError } = await supabase
        .from("additional_to_orders")
        .select(`
          id,
          ato_number,
          title,
          description,
          price_impact,
          discount_percentage,
          delivery_days_impact,
          approved_at
        `)
        .eq("contract_id", contractId)
        .eq("status", "approved")
        .order("sequence_number");

      if (atosError) throw atosError;

      // 4. Buscar configurações das ATOs aprovadas
      let atoConfigurations: any[] = [];
      if (approvedATOs && approvedATOs.length > 0) {
        const atoIds = approvedATOs.map((ato) => ato.id);
        const { data: configs, error: configsError } = await supabase
          .from("ato_configurations")
          .select(`
            *,
            ato:additional_to_orders(ato_number, title)
          `)
          .in("ato_id", atoIds);

        if (configsError) throw configsError;
        atoConfigurations = configs || [];
      }

      // 5. Consolidar dados
      return {
        contract,
        baseSnapshot,
        memorialItems: memorialItems || [],
        selectedOptions: baseSnapshot?.selected_options || [],
        customizations: baseSnapshot?.customizations || [],
        atoConfigurations,
        approvedATOs: approvedATOs || [],
      };
    },
    enabled: !!contractId,
  });
}
