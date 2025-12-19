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

      // Extrair upgrades do snapshot
      const upgrades = baseSnapshot?.selected_upgrades?.map((su: any) => ({
        id: su.upgrade_id || su.id,
        name: su.name || su.upgrade?.name,
        code: su.code || su.upgrade?.code,
        description: su.description || su.upgrade?.description,
        price: su.price,
        delivery_days_impact: su.delivery_days_impact,
        memorial_item_id: su.memorial_item_id,
        memorial_item_name: su.memorial_item?.item_name,
        ...su.upgrade
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

      // Buscar ATOs aprovadas com suas configurações
      const { data: approvedATOs, error: atoError } = await supabase
        .from("additional_to_orders")
        .select(`
          id,
          ato_number,
          title,
          status,
          price_impact,
          delivery_days_impact
        `)
        .eq("contract_id", contractId)
        .eq("status", "approved");

      if (atoError) throw atoError;

      // Buscar configurações de todas as ATOs aprovadas
      let atoItems: any[] = [];
      if (approvedATOs && approvedATOs.length > 0) {
        const { data: atoConfigs, error: configError } = await supabase
          .from("ato_configurations")
          .select("*")
          .in("ato_id", approvedATOs.map(ato => ato.id));

        if (!configError && atoConfigs) {
          atoItems = atoConfigs.map(config => {
            const ato = approvedATOs.find(a => a.id === config.ato_id);
            const details = config.configuration_details as any;
            return {
              id: config.id,
              ato_id: config.ato_id,
              ato_number: ato?.ato_number,
              item_type: config.item_type,
              item_name: details?.item_name || details?.name || config.notes || "Item ATO",
              notes: config.notes,
              configuration_details: details,
            };
          });
        }
      }

      return {
        contract,
        options,
        upgrades,
        memorialItems,
        atoItems,
      };
    },
    enabled: !!contractId,
  });
}
