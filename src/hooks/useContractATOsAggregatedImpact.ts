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

interface ATOBreakdown {
  atoId: string;
  atoNumber: string;
  title: string;
  priceImpact: number;      // Já com delta calculado
  deliveryDaysImpact: number; // MAX do ATO
  hasReplacements: boolean;
}

interface ContractATOsAggregatedImpactResult {
  totalApprovedATOsPrice: number;        // Soma de todos os deltas
  maxApprovedATOsDeliveryDays: number;   // MAX de todos os MAX
  approvedATOsCount: number;
  atoBreakdown: ATOBreakdown[];
}

/**
 * Hook que calcula o impacto consolidado de TODAS as ATOs aprovadas de um contrato:
 * - Preço: soma de todos os deltas (considerando substituições de upgrades)
 * - Dias: MAX de todos os dias (não soma)
 * 
 * @param contractId - ID do contrato
 */
export function useContractATOsAggregatedImpact(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract-atos-aggregated-impact", contractId],
    queryFn: async (): Promise<ContractATOsAggregatedImpactResult> => {
      if (!contractId) throw new Error("Contract ID is required");

      // 1. Buscar contrato com base_snapshot
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("base_snapshot")
        .eq("id", contractId)
        .single();

      if (contractError) throw contractError;

      const baseSnapshot = contract?.base_snapshot as BaseSnapshot | null;
      const existingUpgrades = baseSnapshot?.selected_upgrades || [];

      // 2. Mapear upgrades existentes por memorial_item_id
      const existingUpgradesByMemorialItem = new Map<string, { price: number; name: string }>();
      existingUpgrades.forEach((upg: SelectedUpgrade) => {
        existingUpgradesByMemorialItem.set(upg.memorial_item_id, {
          price: upg.price,
          name: upg.upgrade?.name || 'Upgrade anterior',
        });
      });

      // 3. Buscar ATOs aprovadas
      const { data: approvedATOs, error: atosError } = await supabase
        .from("additional_to_orders")
        .select("id, ato_number, title, price_impact, delivery_days_impact")
        .eq("contract_id", contractId)
        .eq("status", "approved");

      if (atosError) throw atosError;

      // 4. Processar cada ATO
      const atoBreakdown: ATOBreakdown[] = [];

      for (const ato of approvedATOs || []) {
        // Buscar configurações da ATO
        const { data: configurations } = await supabase
          .from("ato_configurations")
          .select("*")
          .eq("ato_id", ato.id);

        let atoPriceImpact = 0;
        let atoMaxDays = 0;
        let hasReplacements = false;

        for (const config of configurations || []) {
          const deliveryDays = config.delivery_impact_days || 0;
          atoMaxDays = Math.max(atoMaxDays, deliveryDays);

          if (config.item_type === "upgrade" && config.item_id) {
            // Buscar memorial_item_id deste upgrade
            const { data: upgradeData } = await supabase
              .from("memorial_upgrades")
              .select("id, memorial_item_id, price")
              .eq("id", config.item_id)
              .single();

            if (upgradeData) {
              const memorialItemId = upgradeData.memorial_item_id;
              const newPrice = config.original_price || upgradeData.price || 0;

              // Verificar substituição
              const existingUpgrade = memorialItemId 
                ? existingUpgradesByMemorialItem.get(memorialItemId) 
                : null;

              if (existingUpgrade) {
                // Substituição: calcular delta
                atoPriceImpact += newPrice - existingUpgrade.price;
                hasReplacements = true;
              } else {
                // Adição: preço cheio
                atoPriceImpact += newPrice;
              }
            }
          } else {
            // Outros tipos: usar preço normal
            const price = config.calculated_price || config.original_price || 0;
            atoPriceImpact += price;
          }
        }

        atoBreakdown.push({
          atoId: ato.id,
          atoNumber: ato.ato_number,
          title: ato.title,
          priceImpact: atoPriceImpact,
          deliveryDaysImpact: atoMaxDays,
          hasReplacements,
        });
      }

      // 5. Calcular totais consolidados
      const totalApprovedATOsPrice = atoBreakdown.reduce((sum, ato) => sum + ato.priceImpact, 0);
      const maxApprovedATOsDeliveryDays = atoBreakdown.reduce(
        (max, ato) => Math.max(max, ato.deliveryDaysImpact), 
        0
      );

      return {
        totalApprovedATOsPrice,
        maxApprovedATOsDeliveryDays,
        approvedATOsCount: atoBreakdown.length,
        atoBreakdown,
      };
    },
    enabled: !!contractId,
  });
}
