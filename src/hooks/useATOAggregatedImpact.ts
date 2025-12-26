import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SelectedUpgrade {
  upgrade_id: string;
  memorial_item_id: string;
  price: number;
  upgrade?: {
    name: string;
    id: string;
  };
}

interface BaseSnapshot {
  selected_upgrades?: SelectedUpgrade[];
  [key: string]: any;
}

interface ItemImpactInfo {
  configId: string;
  itemId: string | null;
  itemName: string;
  itemType: string;
  priceImpact: number; // Delta se for substituição de upgrade
  deliveryDays: number;
  isReplacement: boolean;
  oldPrice?: number;
  oldName?: string;
}

interface ATOAggregatedImpactResult {
  totalPriceImpact: number;         // Soma dos deltas (não preços brutos)
  maxDeliveryDaysImpact: number;    // MAX dos itens (não soma)
  hasUpgradeReplacements: boolean;
  itemsBreakdown: ItemImpactInfo[];
}

/**
 * Hook que calcula o impacto agregado de uma ATO individual considerando:
 * - Preço: soma de deltas (não preços brutos) para upgrades com substituição
 * - Dias: MAX dos itens (não soma) - trabalhos são paralelos
 * 
 * @param atoId - ID da ATO
 * @param contractId - ID do contrato (para buscar base_snapshot)
 */
export function useATOAggregatedImpact(atoId: string | undefined, contractId: string | undefined) {
  return useQuery({
    queryKey: ["ato-aggregated-impact", atoId, contractId],
    queryFn: async (): Promise<ATOAggregatedImpactResult> => {
      if (!atoId || !contractId) throw new Error("ATO ID and Contract ID are required");

      // 1. Buscar configurações da ATO
      const { data: configurations, error: configError } = await supabase
        .from("ato_configurations")
        .select("*")
        .eq("ato_id", atoId);

      if (configError) throw configError;

      // 2. Buscar contrato com base_snapshot
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("base_snapshot")
        .eq("id", contractId)
        .single();

      if (contractError) throw contractError;

      const baseSnapshot = contract?.base_snapshot as BaseSnapshot | null;
      const existingUpgrades = baseSnapshot?.selected_upgrades || [];

      // 3. Mapear upgrades existentes por memorial_item_id
      const existingUpgradesByMemorialItem = new Map<string, { price: number; name: string; upgradeId: string }>();
      existingUpgrades.forEach((upg: SelectedUpgrade) => {
        existingUpgradesByMemorialItem.set(upg.memorial_item_id, {
          price: upg.price,
          name: upg.upgrade?.name || 'Upgrade anterior',
          upgradeId: upg.upgrade_id,
        });
      });

      // 4. Processar cada configuração
      const itemsBreakdown: ItemImpactInfo[] = [];
      let maxDeliveryDays = 0;

      for (const config of configurations || []) {
        const configDetails = config.configuration_details as Record<string, any> | null;
        const deliveryDays = config.delivery_impact_days || 0;
        
        // Atualizar MAX de dias
        maxDeliveryDays = Math.max(maxDeliveryDays, deliveryDays);

        if (config.item_type === "upgrade" && config.item_id) {
          // Buscar memorial_item_id deste upgrade
          const { data: upgradeData } = await supabase
            .from("memorial_upgrades")
            .select("id, name, memorial_item_id, price")
            .eq("id", config.item_id)
            .single();

          if (upgradeData) {
            const memorialItemId = upgradeData.memorial_item_id;
            const newPrice = config.original_price || upgradeData.price || 0;
            const itemName = configDetails?.item_name || upgradeData.name;

            // Verificar substituição
            const existingUpgrade = memorialItemId 
              ? existingUpgradesByMemorialItem.get(memorialItemId) 
              : null;

            if (existingUpgrade) {
              // Substituição: calcular delta
              const delta = newPrice - existingUpgrade.price;
              itemsBreakdown.push({
                configId: config.id,
                itemId: upgradeData.id,
                itemName,
                itemType: config.item_type,
                priceImpact: delta,
                deliveryDays,
                isReplacement: true,
                oldPrice: existingUpgrade.price,
                oldName: existingUpgrade.name,
              });
            } else {
              // Adição: preço cheio
              itemsBreakdown.push({
                configId: config.id,
                itemId: upgradeData.id,
                itemName,
                itemType: config.item_type,
                priceImpact: newPrice,
                deliveryDays,
                isReplacement: false,
              });
            }
          }
        } else {
          // Outros tipos: usar preço normal
          const price = config.calculated_price || config.original_price || 0;
          const itemName = configDetails?.item_name || config.item_type;
          
          itemsBreakdown.push({
            configId: config.id,
            itemId: config.item_id,
            itemName,
            itemType: config.item_type,
            priceImpact: price,
            deliveryDays,
            isReplacement: false,
          });
        }
      }

      // 5. Calcular totais
      const totalPriceImpact = itemsBreakdown.reduce((sum, item) => sum + item.priceImpact, 0);
      const hasUpgradeReplacements = itemsBreakdown.some(item => item.isReplacement);

      return {
        totalPriceImpact,
        maxDeliveryDaysImpact: maxDeliveryDays,
        hasUpgradeReplacements,
        itemsBreakdown,
      };
    },
    enabled: !!atoId && !!contractId,
  });
}
