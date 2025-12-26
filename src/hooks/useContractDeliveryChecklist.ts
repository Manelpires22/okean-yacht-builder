import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryChecklistItem {
  id: string;
  contract_id: string;
  item_type: "option" | "upgrade" | "customization" | "ato_item" | "ato_config_item" | "memorial_item";
  item_id: string;
  item_name: string;
  item_code: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface DeliveryProgress {
  total: number;
  verified: number;
  percentage: number;
}

/**
 * Hook para buscar checklist de entrega de um contrato
 * Se o checklist estiver vazio, popula automaticamente com os itens do contrato
 */
export function useContractDeliveryChecklist(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract-delivery-checklist", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      // Buscar checklist existente
      const { data: checklist, error: checklistError } = await supabase
        .from("contract_delivery_checklist")
        .select("*")
        .eq("contract_id", contractId)
        .order("item_type")
        .order("item_name");

      if (checklistError) throw checklistError;

      // Se checklist vazio, popular automaticamente
      if (!checklist || checklist.length === 0) {
        await populateChecklist(contractId);
        
        // Buscar novamente após popular
        const { data: newChecklist, error: newError } = await supabase
          .from("contract_delivery_checklist")
          .select("*")
          .eq("contract_id", contractId)
          .order("item_type")
          .order("item_name");

        if (newError) throw newError;
        return newChecklist as DeliveryChecklistItem[];
      }

      return checklist as DeliveryChecklistItem[];
    },
    enabled: !!contractId,
  });
}

/**
 * Hook para repopular o checklist (limpa e recria)
 */
export function useRepopulateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      // 1. Deletar checklist existente
      const { error: deleteError } = await supabase
        .from("contract_delivery_checklist")
        .delete()
        .eq("contract_id", contractId);

      if (deleteError) throw deleteError;

      // 2. Repopular
      await populateChecklist(contractId);

      // 3. Buscar novamente
      const { data: newChecklist, error: newError } = await supabase
        .from("contract_delivery_checklist")
        .select("*")
        .eq("contract_id", contractId)
        .order("item_type")
        .order("item_name");

      if (newError) throw newError;
      return newChecklist as DeliveryChecklistItem[];
    },
    onSuccess: (_, contractId) => {
      queryClient.invalidateQueries({ queryKey: ["contract-delivery-checklist", contractId] });
    },
  });
}

/**
 * Função auxiliar para popular checklist com itens do contrato
 */
async function populateChecklist(contractId: string) {
  // Buscar dados do contrato
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`
      id,
      base_snapshot,
      yacht_model_id,
      quotation_id
    `)
    .eq("id", contractId)
    .single();

  if (contractError) throw contractError;

  const items: any[] = [];
  const baseSnapshot = contract.base_snapshot as any;

  // 1. Adicionar opcionais do snapshot
  if (baseSnapshot?.selected_options) {
    baseSnapshot.selected_options.forEach((opt: any) => {
      items.push({
        contract_id: contractId,
        item_type: "option",
        item_id: opt.option_id || opt.option?.id,
        item_name: opt.option?.name || "Opcional",
        item_code: opt.option?.code,
      });
    });
  }

  // 2. Adicionar upgrades do snapshot
  if (baseSnapshot?.selected_upgrades) {
    baseSnapshot.selected_upgrades.forEach((upg: any) => {
      items.push({
        contract_id: contractId,
        item_type: "upgrade",
        item_id: upg.upgrade_id || upg.upgrade?.id,
        item_name: upg.upgrade?.name || "Upgrade",
        item_code: upg.upgrade?.code,
      });
    });
  }

  // 3. Buscar customizações incluídas no contrato
  if (contract.quotation_id) {
    const { data: customizations, error: customError } = await supabase
      .from("quotation_customizations")
      .select("id, item_name, customization_code")
      .eq("quotation_id", contract.quotation_id)
      .eq("included_in_contract", true);

    if (!customError && customizations) {
      customizations.forEach((cust: any) => {
        items.push({
          contract_id: contractId,
          item_type: "customization",
          item_id: cust.id,
          item_name: cust.item_name,
          item_code: cust.customization_code,
        });
      });
    }
  }

  // 4. Buscar ATOs aprovadas
  const { data: atos, error: atosError } = await supabase
    .from("additional_to_orders")
    .select("id, title, ato_number")
    .eq("contract_id", contractId)
    .eq("status", "approved");

  if (!atosError && atos) {
    atos.forEach((ato: any) => {
      items.push({
        contract_id: contractId,
        item_type: "ato_item",
        item_id: ato.id,
        item_name: ato.title,
        item_code: ato.ato_number,
      });
    });

    // 5. Buscar TODAS as configurações das ATOs (exceto rejeitadas)
    if (atos.length > 0) {
      const atoIds = atos.map((ato: any) => ato.id);
      
      // Buscar configurações - trazer tudo, exceto rejeitadas
      const { data: atoConfigs, error: configsError } = await supabase
        .from("ato_configurations")
        .select(`
          id,
          item_type,
          item_id,
          configuration_details,
          notes,
          pm_status,
          ato:additional_to_orders(ato_number)
        `)
        .in("ato_id", atoIds)
        .neq("pm_status", "rejected");

      if (!configsError && atoConfigs && atoConfigs.length > 0) {
        // Coletar IDs por tipo para buscar nomes
        const optionIds: string[] = [];
        const memorialItemIds: string[] = [];
        const upgradeIds: string[] = [];

        atoConfigs.forEach((config: any) => {
          if (config.item_id) {
            if (config.item_type === "option") {
              optionIds.push(config.item_id);
            } else if (config.item_type === "memorial_item") {
              memorialItemIds.push(config.item_id);
            } else if (config.item_type === "upgrade") {
              upgradeIds.push(config.item_id);
            }
          }
        });

        // Buscar nomes em lote
        const namesMaps = await fetchItemNames(optionIds, memorialItemIds, upgradeIds);

        // Processar configurações
        atoConfigs.forEach((config: any) => {
          const details = config.configuration_details as any;
          
          // Determinar nome do item com fallback
          let itemName = details?.item_name || details?.name || details?.title || config.notes;
          
          // Se não tem nome nos details, buscar na tabela relacionada
          if (!itemName && config.item_id) {
            if (config.item_type === "option" && namesMaps.options[config.item_id]) {
              itemName = namesMaps.options[config.item_id].name;
            } else if (config.item_type === "memorial_item" && namesMaps.memorialItems[config.item_id]) {
              itemName = namesMaps.memorialItems[config.item_id].name;
            } else if (config.item_type === "upgrade" && namesMaps.upgrades[config.item_id]) {
              itemName = namesMaps.upgrades[config.item_id].name;
            }
          }

          // Fallback final
          if (!itemName) {
            itemName = `Item ${config.item_type}`;
          }

          // Determinar código do item
          let itemCode = config.ato?.ato_number;
          if (config.item_id) {
            if (config.item_type === "option" && namesMaps.options[config.item_id]?.code) {
              itemCode = namesMaps.options[config.item_id].code;
            } else if (config.item_type === "upgrade" && namesMaps.upgrades[config.item_id]?.code) {
              itemCode = namesMaps.upgrades[config.item_id].code;
            }
          }

          items.push({
            contract_id: contractId,
            item_type: "ato_config_item",
            item_id: config.id,
            item_name: itemName,
            item_code: itemCode,
          });
        });
      }
    }
  }

  // Inserir todos os itens no checklist
  if (items.length > 0) {
    const { error: insertError } = await supabase
      .from("contract_delivery_checklist")
      .insert(items);

    if (insertError) {
      console.error("Error populating checklist:", insertError);
      throw insertError;
    }
  }
}

/**
 * Buscar nomes de itens em lote para melhor performance
 */
async function fetchItemNames(
  optionIds: string[],
  memorialItemIds: string[],
  upgradeIds: string[]
): Promise<{
  options: Record<string, { name: string; code: string }>;
  memorialItems: Record<string, { name: string }>;
  upgrades: Record<string, { name: string; code: string }>;
}> {
  const result = {
    options: {} as Record<string, { name: string; code: string }>,
    memorialItems: {} as Record<string, { name: string }>,
    upgrades: {} as Record<string, { name: string; code: string }>,
  };

  // Buscar opções
  if (optionIds.length > 0) {
    const { data: options } = await supabase
      .from("options")
      .select("id, name, code")
      .in("id", optionIds);

    if (options) {
      options.forEach((opt) => {
        result.options[opt.id] = { name: opt.name, code: opt.code };
      });
    }
  }

  // Buscar itens de memorial
  if (memorialItemIds.length > 0) {
    const { data: memorialItems } = await supabase
      .from("memorial_items")
      .select("id, item_name")
      .in("id", memorialItemIds);

    if (memorialItems) {
      memorialItems.forEach((item) => {
        result.memorialItems[item.id] = { name: item.item_name };
      });
    }
  }

  // Buscar upgrades
  if (upgradeIds.length > 0) {
    const { data: upgrades } = await supabase
      .from("memorial_upgrades")
      .select("id, name, code")
      .in("id", upgradeIds);

    if (upgrades) {
      upgrades.forEach((upg) => {
        result.upgrades[upg.id] = { name: upg.name, code: upg.code };
      });
    }
  }

  return result;
}

/**
 * Calcular progresso de verificação
 */
export function calculateProgress(items: DeliveryChecklistItem[]): DeliveryProgress {
  const total = items.length;
  const verified = items.filter((item) => item.is_verified).length;
  const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;

  return { total, verified, percentage };
}
