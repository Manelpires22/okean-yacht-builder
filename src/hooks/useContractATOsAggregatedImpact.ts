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

// Detalhes de cada item dentro de uma ATO
interface ATOBreakdownItem {
  itemType: string;
  itemName: string;
  itemCode?: string;
  originalPrice: number;       // Valor bruto do item
  discountPercentage: number;  // Desconto aplicado no item
  discountAmount: number;      // Valor do desconto
  replacementCredit: number;   // Crédito se substituição (negativo)
  netPrice: number;            // Preço líquido final do item
  deliveryDays: number;
}

interface ATOBreakdown {
  atoId: string;
  atoNumber: string;
  title: string;
  items: ATOBreakdownItem[];       // Detalhes de cada item da ATO
  grossTotal: number;              // Soma dos originalPrice
  totalDiscounts: number;          // Soma dos descontos
  totalReplacementCredits: number; // Soma dos créditos de substituição (negativo)
  netTotal: number;                // Resultado final da ATO (grossTotal - discounts + credits)
  deliveryDaysImpact: number;      // MAX de dias da ATO
  hasReplacements: boolean;
}

interface ContractATOsAggregatedImpactResult {
  // Valores agregados de todas as ATOs
  totalApprovedATOsPrice: number;        // Soma de todos os netTotal
  totalGrossPrice: number;               // Soma de todos os grossTotal
  totalDiscounts: number;                // Soma de todos os descontos
  totalReplacementCredits: number;       // Soma de todos os créditos
  maxApprovedATOsDeliveryDays: number;   // MAX de todos os MAX
  approvedATOsCount: number;
  atoBreakdown: ATOBreakdown[];
}

/**
 * Hook que calcula o impacto consolidado de TODAS as ATOs aprovadas de um contrato:
 * - Para cada ATO: calcula itens individuais com bruto, desconto, crédito e líquido
 * - Preço: soma de todos os netTotal
 * - Dias: MAX de todos os dias (não soma)
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
        .select("id, ato_number, title")
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

        const items: ATOBreakdownItem[] = [];
        let atoMaxDays = 0;
        let hasReplacements = false;

        for (const config of configurations || []) {
          const deliveryDays = config.delivery_impact_days || 0;
          atoMaxDays = Math.max(atoMaxDays, deliveryDays);

          const originalPrice = config.original_price || 0;
          const discountPercentage = config.discount_percentage || 0;
          const discountAmount = originalPrice * (discountPercentage / 100);
          
          let replacementCredit = 0;
          let itemName = config.notes || 'Item';
          let itemCode = '';

          // Buscar nome do item baseado no tipo
          if (config.item_type === "upgrade" && config.item_id) {
            const { data: upgradeData } = await supabase
              .from("memorial_upgrades")
              .select("id, name, code, memorial_item_id, price")
              .eq("id", config.item_id)
              .single();

            if (upgradeData) {
              itemName = upgradeData.name;
              itemCode = upgradeData.code;
              const memorialItemId = upgradeData.memorial_item_id;

              // Verificar substituição
              const existingUpgrade = memorialItemId 
                ? existingUpgradesByMemorialItem.get(memorialItemId) 
                : null;

              if (existingUpgrade) {
                // Substituição: o crédito é o preço do upgrade antigo (negativo)
                replacementCredit = -existingUpgrade.price;
                hasReplacements = true;
              }
            }
          } else if (config.item_type === "option" && config.item_id) {
            const { data: optionData } = await supabase
              .from("options")
              .select("id, name, code")
              .eq("id", config.item_id)
              .single();

            if (optionData) {
              itemName = optionData.name;
              itemCode = optionData.code;
            }
          } else if (config.item_type === "customization") {
            itemName = config.notes || 'Customização';
          }

          // Preço líquido = bruto - desconto + crédito (crédito é negativo)
          const netPrice = originalPrice - discountAmount + replacementCredit;

          items.push({
            itemType: config.item_type,
            itemName,
            itemCode,
            originalPrice,
            discountPercentage,
            discountAmount,
            replacementCredit,
            netPrice,
            deliveryDays,
          });
        }

        // Calcular totais da ATO
        const grossTotal = items.reduce((sum, item) => sum + item.originalPrice, 0);
        const totalDiscounts = items.reduce((sum, item) => sum + item.discountAmount, 0);
        const totalReplacementCredits = items.reduce((sum, item) => sum + item.replacementCredit, 0);
        const netTotal = items.reduce((sum, item) => sum + item.netPrice, 0);

        atoBreakdown.push({
          atoId: ato.id,
          atoNumber: ato.ato_number,
          title: ato.title,
          items,
          grossTotal,
          totalDiscounts,
          totalReplacementCredits,
          netTotal,
          deliveryDaysImpact: atoMaxDays,
          hasReplacements,
        });
      }

      // 5. Calcular totais consolidados
      const totalApprovedATOsPrice = atoBreakdown.reduce((sum, ato) => sum + ato.netTotal, 0);
      const totalGrossPrice = atoBreakdown.reduce((sum, ato) => sum + ato.grossTotal, 0);
      const totalDiscounts = atoBreakdown.reduce((sum, ato) => sum + ato.totalDiscounts, 0);
      const totalReplacementCredits = atoBreakdown.reduce((sum, ato) => sum + ato.totalReplacementCredits, 0);
      const maxApprovedATOsDeliveryDays = atoBreakdown.reduce(
        (max, ato) => Math.max(max, ato.deliveryDaysImpact), 
        0
      );

      return {
        totalApprovedATOsPrice,
        totalGrossPrice,
        totalDiscounts,
        totalReplacementCredits,
        maxApprovedATOsDeliveryDays,
        approvedATOsCount: atoBreakdown.length,
        atoBreakdown,
      };
    },
    enabled: !!contractId,
  });
}
