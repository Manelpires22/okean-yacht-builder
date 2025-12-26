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

interface UpgradeDeltaInfo {
  configId: string;
  upgradeId: string;
  upgradeName: string;
  memorialItemId: string | null;
  newPrice: number;
  oldPrice: number | null;
  oldUpgradeName: string | null;
  delta: number;
  isReplacement: boolean;
}

interface RealPriceImpactResult {
  totalImpact: number;
  upgradeDeltaDetails: UpgradeDeltaInfo[];
  otherItemsTotal: number;
}

/**
 * Hook que calcula o impacto real de preço de uma ATO considerando:
 * - Upgrades que substituem outros (calcula delta ao invés de preço cheio)
 * - Outros tipos de itens (usa preço normal)
 * 
 * @param atoId - ID da ATO
 * @param contractId - ID do contrato (para buscar base_snapshot)
 */
export function useATORealPriceImpact(atoId: string | undefined, contractId: string | undefined) {
  return useQuery({
    queryKey: ["ato-real-price-impact", atoId, contractId],
    queryFn: async (): Promise<RealPriceImpactResult> => {
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

      // 3. Mapear upgrades existentes por memorial_item_id para rápido lookup
      const existingUpgradesByMemorialItem = new Map<string, { price: number; name: string; upgradeId: string }>();
      existingUpgrades.forEach((upg: SelectedUpgrade) => {
        existingUpgradesByMemorialItem.set(upg.memorial_item_id, {
          price: upg.price,
          name: upg.upgrade?.name || 'Upgrade anterior',
          upgradeId: upg.upgrade_id,
        });
      });

      // 4. Para cada configuração tipo "upgrade", buscar memorial_item_id do upgrade
      const upgradeDeltaDetails: UpgradeDeltaInfo[] = [];
      let otherItemsTotal = 0;

      for (const config of configurations || []) {
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
            const configDetails = config.configuration_details as Record<string, any> | null;
            const upgradeName = configDetails?.item_name || upgradeData.name;

            // Verificar se esse memorial_item_id já tem um upgrade no contrato
            const existingUpgrade = memorialItemId 
              ? existingUpgradesByMemorialItem.get(memorialItemId) 
              : null;

            if (existingUpgrade) {
              // Substituição: calcular delta
              const delta = newPrice - existingUpgrade.price;
              upgradeDeltaDetails.push({
                configId: config.id,
                upgradeId: upgradeData.id,
                upgradeName,
                memorialItemId,
                newPrice,
                oldPrice: existingUpgrade.price,
                oldUpgradeName: existingUpgrade.name,
                delta,
                isReplacement: true,
              });
            } else {
              // Adição: preço cheio
              upgradeDeltaDetails.push({
                configId: config.id,
                upgradeId: upgradeData.id,
                upgradeName,
                memorialItemId,
                newPrice,
                oldPrice: null,
                oldUpgradeName: null,
                delta: newPrice,
                isReplacement: false,
              });
            }
          }
        } else {
          // Outros tipos: usar preço normal
          const price = config.calculated_price || config.original_price || 0;
          otherItemsTotal += price;
        }
      }

      // 5. Calcular total real
      const upgradesTotal = upgradeDeltaDetails.reduce((sum, detail) => sum + detail.delta, 0);
      const totalImpact = upgradesTotal + otherItemsTotal;

      return {
        totalImpact,
        upgradeDeltaDetails,
        otherItemsTotal,
      };
    },
    enabled: !!atoId && !!contractId,
  });
}

/**
 * Versão simplificada que apenas retorna o impacto total corrigido
 */
export function useATOCorrectedImpact(atoId: string | undefined, contractId: string | undefined) {
  const result = useATORealPriceImpact(atoId, contractId);
  
  return {
    ...result,
    correctedImpact: result.data?.totalImpact ?? null,
    hasReplacements: (result.data?.upgradeDeltaDetails?.filter(d => d.isReplacement).length ?? 0) > 0,
  };
}
