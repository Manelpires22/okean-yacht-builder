import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ItemUsageStatus {
  inContract: boolean;
  inATOs: string[]; // e.g., ["ATO 1", "ATO 2"]
}

interface ConflictingUpgrade {
  upgradeId: string;
  upgradeName: string;
  source: string; // 'No contrato' ou 'ATO 1', 'ATO 2', etc.
}

interface ItemUsageMap {
  options: Map<string, ItemUsageStatus>;
  upgrades: Map<string, ItemUsageStatus>;
  memorialItems: Map<string, ItemUsageStatus>;
  upgradesByMemorialItem: Map<string, ConflictingUpgrade>;
}

export function useItemUsageCheck(contractId: string | undefined) {
  // Buscar contrato com base_snapshot e ATOs
  const { data: contract } = useQuery({
    queryKey: ['contract-usage-check', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('base_snapshot')
        .eq('id', contractId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });

  // Buscar todas as ATOs do contrato com suas configurações
  const { data: atos } = useQuery({
    queryKey: ['ato-configurations-usage', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('additional_to_orders')
        .select(`
          id,
          ato_number,
          ato_configurations (
            item_id,
            item_type,
            configuration_details
          )
        `)
        .eq('contract_id', contractId!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });

  const usageMap = useMemo<ItemUsageMap>(() => {
    const optionsMap = new Map<string, ItemUsageStatus>();
    const upgradesMap = new Map<string, ItemUsageStatus>();
    const memorialItemsMap = new Map<string, ItemUsageStatus>();
    const upgradesByMemorialItemMap = new Map<string, ConflictingUpgrade>();

    // Parse base_snapshot para itens do contrato original
    if (contract?.base_snapshot) {
      const snapshot = contract.base_snapshot as any;
      
      // Opções do contrato original
      if (snapshot.selected_options && Array.isArray(snapshot.selected_options)) {
        snapshot.selected_options.forEach((opt: any) => {
          const optionId = opt.option_id || opt.id;
          if (optionId) {
            optionsMap.set(optionId, { inContract: true, inATOs: [] });
          }
        });
      }

      // Upgrades do contrato original
      if (snapshot.selected_upgrades && Array.isArray(snapshot.selected_upgrades)) {
        snapshot.selected_upgrades.forEach((upg: any) => {
          const upgradeId = upg.upgrade_id || upg.id;
          if (upgradeId) {
            upgradesMap.set(upgradeId, { inContract: true, inATOs: [] });
          }
          
          // Mapear por memorial_item_id para detecção de conflitos
          const memorialItemId = upg.memorial_item_id;
          const upgradeName = upg.upgrade?.name || upg.name || 'Upgrade';
          if (memorialItemId) {
            upgradesByMemorialItemMap.set(memorialItemId, {
              upgradeId,
              upgradeName,
              source: 'No contrato'
            });
          }
        });
      }
    }

    // Adicionar itens das ATOs
    if (atos) {
      atos.forEach((ato) => {
        const atoLabel = ato.ato_number || `ATO ${ato.id.slice(0, 6)}`;
        
        ato.ato_configurations?.forEach((config: any) => {
          const itemId = config.item_id;
          if (!itemId) return;

          const itemType = config.item_type;
          const configDetails = config.configuration_details || {};

          if (itemType === 'option') {
            const existing = optionsMap.get(itemId);
            if (existing) {
              existing.inATOs.push(atoLabel);
            } else {
              optionsMap.set(itemId, { inContract: false, inATOs: [atoLabel] });
            }
          } else if (itemType === 'upgrade') {
            const existing = upgradesMap.get(itemId);
            if (existing) {
              existing.inATOs.push(atoLabel);
            } else {
              upgradesMap.set(itemId, { inContract: false, inATOs: [atoLabel] });
            }
            
            // Mapear por memorial_item_id para detecção de conflitos
            const memorialItemId = configDetails.memorial_item_id;
            const upgradeName = configDetails.name || 'Upgrade';
            if (memorialItemId) {
              upgradesByMemorialItemMap.set(memorialItemId, {
                upgradeId: itemId,
                upgradeName,
                source: atoLabel
              });
            }
          } else if (itemType === 'memorial_item' || itemType === 'define_finishing') {
            const existing = memorialItemsMap.get(itemId);
            if (existing) {
              existing.inATOs.push(atoLabel);
            } else {
              memorialItemsMap.set(itemId, { inContract: false, inATOs: [atoLabel] });
            }
          }
        });
      });
    }

    return {
      options: optionsMap,
      upgrades: upgradesMap,
      memorialItems: memorialItemsMap,
      upgradesByMemorialItem: upgradesByMemorialItemMap,
    };
  }, [contract, atos]);

  const getOptionStatus = (optionId: string): ItemUsageStatus | null => {
    return usageMap.options.get(optionId) || null;
  };

  const getUpgradeStatus = (upgradeId: string): ItemUsageStatus | null => {
    return usageMap.upgrades.get(upgradeId) || null;
  };

  const getMemorialItemStatus = (itemId: string): ItemUsageStatus | null => {
    return usageMap.memorialItems.get(itemId) || null;
  };

  // Nova função: verificar se já existe upgrade para o mesmo item do memorial
  const getConflictingUpgrade = (memorialItemId: string, currentUpgradeId?: string): ConflictingUpgrade | null => {
    const existing = usageMap.upgradesByMemorialItem.get(memorialItemId);
    // Se existir e não for o mesmo upgrade
    if (existing && existing.upgradeId !== currentUpgradeId) {
      return existing;
    }
    return null;
  };

  return {
    getOptionStatus,
    getUpgradeStatus,
    getMemorialItemStatus,
    getConflictingUpgrade,
    isLoading: !contract && !atos,
  };
}
