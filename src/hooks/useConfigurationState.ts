import { useState, useEffect, useMemo, useCallback } from "react";

export interface SelectedOption {
  option_id: string;
  quantity: number;
  unit_price: number;
  delivery_days_impact: number;
  customization_notes?: string;
}

export interface Customization {
  memorial_item_id: string;
  item_name: string;
  notes: string;
  quantity?: number;
  image_url?: string;
  is_free_customization?: boolean;
  workflow_status?: string;
  pm_final_price?: number;
  pm_final_delivery_impact_days?: number;
}

export interface SelectedUpgrade {
  upgrade_id: string;
  memorial_item_id: string;
  name: string;
  price: number;
  delivery_days_impact: number;
  customization_notes?: string;
}

export interface HullNumberData {
  id: string;
  hull_number: string;
  brand: string;
  hull_entry_date: string;
  estimated_delivery_date: string;
}

export interface CommissionData {
  id: string;
  name: string;
  percent: number;
  type: string;
}

export interface ConfigurationState {
  commission_data: CommissionData | null;
  yacht_model_id: string | null;
  base_price: number;
  base_delivery_days: number;
  selected_options: SelectedOption[];
  selected_upgrades: SelectedUpgrade[];
  base_discount_percentage: number;
  options_discount_percentage: number;
  customizations: Customization[];
  hull_number_data: HullNumberData | null;
}

const STORAGE_KEY = "yacht-configuration-draft";

const getInitialState = (): ConfigurationState => ({
  commission_data: null,
  yacht_model_id: null,
  base_price: 0,
  base_delivery_days: 0,
  selected_options: [],
  selected_upgrades: [],
  base_discount_percentage: 0,
  options_discount_percentage: 0,
  customizations: [],
  hull_number_data: null,
});

export function useConfigurationState() {
  const [state, setState] = useState<ConfigurationState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...getInitialState(),
          ...parsed,
          selected_options: Array.isArray(parsed.selected_options) ? parsed.selected_options : [],
          selected_upgrades: Array.isArray(parsed.selected_upgrades) ? parsed.selected_upgrades : [],
          customizations: Array.isArray(parsed.customizations) ? parsed.customizations : [],
        };
      } catch {
        return getInitialState();
      }
    }
    return getInitialState();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setCommission = useCallback((commission: CommissionData) => {
    setState((prev) => ({
      ...prev,
      commission_data: commission,
    }));
  }, []);

  const setYachtModel = useCallback((modelId: string, basePrice: number, baseDeliveryDays: number, hullNumberData?: HullNumberData) => {
    setState((prev) => ({
      ...getInitialState(),
      commission_data: prev.commission_data, // Preservar a comissão selecionada
      yacht_model_id: modelId,
      base_price: basePrice,
      base_delivery_days: baseDeliveryDays,
      hull_number_data: hullNumberData || null,
    }));
  }, []);

  const setBaseDiscount = useCallback((percentage: number) => {
    setState((prev) => ({
      ...prev,
      base_discount_percentage: Math.max(0, Math.min(100, percentage)),
    }));
  }, []);

  const setOptionsDiscount = useCallback((percentage: number) => {
    setState((prev) => ({
      ...prev,
      options_discount_percentage: Math.max(0, Math.min(100, percentage)),
    }));
  }, []);

  const addOption = useCallback((option: SelectedOption) => {
    setState((prev) => ({
      ...prev,
      selected_options: [...prev.selected_options, option],
    }));
  }, []);

  const removeOption = useCallback((optionId: string) => {
    setState((prev) => ({
      ...prev,
      selected_options: prev.selected_options.filter((o) => o.option_id !== optionId),
    }));
  }, []);

  const updateOptionQuantity = useCallback((optionId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      selected_options: prev.selected_options.map((o) =>
        o.option_id === optionId ? { ...o, quantity } : o
      ),
    }));
  }, []);

  const updateOptionCustomization = useCallback((optionId: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      selected_options: prev.selected_options.map((o) =>
        o.option_id === optionId ? { ...o, customization_notes: notes } : o
      ),
    }));
  }, []);

  // Upgrade functions
  const selectUpgrade = useCallback((upgrade: SelectedUpgrade) => {
    setState((prev) => ({
      ...prev,
      selected_upgrades: [
        ...prev.selected_upgrades.filter((u) => u.memorial_item_id !== upgrade.memorial_item_id),
        upgrade,
      ],
    }));
  }, []);

  const removeUpgrade = useCallback((memorialItemId: string) => {
    setState((prev) => ({
      ...prev,
      selected_upgrades: prev.selected_upgrades.filter((u) => u.memorial_item_id !== memorialItemId),
    }));
  }, []);

  const getSelectedUpgradeForItem = useCallback((memorialItemId: string) => {
    return state.selected_upgrades.find((u) => u.memorial_item_id === memorialItemId);
  }, [state.selected_upgrades]);

  // Customization functions
  const addCustomization = useCallback((customization: Customization) => {
    setState((prev) => ({
      ...prev,
      customizations: [
        ...prev.customizations.filter((c) => c.memorial_item_id !== customization.memorial_item_id),
        customization,
      ],
    }));
  }, []);

  const removeCustomization = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      customizations: prev.customizations.filter((c) => c.memorial_item_id !== itemId),
    }));
  }, []);

  const getCustomization = useCallback((itemId: string) => {
    return state.customizations.find((c) => c.memorial_item_id === itemId);
  }, [state.customizations]);

  const clearConfiguration = useCallback(() => {
    setState(getInitialState());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loadFromQuotation = useCallback((quotation: any) => {
    const optionCustomizations = quotation.quotation_customizations?.filter(
      (qc: any) => qc.option_id
    ) || [];
    
    setState({
      // Preservar commission_data se já tiver, senão null (cotação antiga)
      commission_data: null,
      yacht_model_id: quotation.yacht_model_id,
      base_price: quotation.base_price || 0,
      base_delivery_days: quotation.base_delivery_days || 0,
      base_discount_percentage: quotation.base_discount_percentage || 0,
      options_discount_percentage: quotation.options_discount_percentage || 0,
      hull_number_data: quotation.hull_number_id ? {
        id: quotation.hull_number_id,
        hull_number: quotation.hull_number?.hull_number || '',
        brand: quotation.hull_number?.brand || 'OKEAN',
        hull_entry_date: quotation.hull_number?.hull_entry_date || '',
        estimated_delivery_date: quotation.hull_number?.estimated_delivery_date || '',
      } : null,
      selected_options: quotation.quotation_options?.map((qo: any) => {
        const customization = optionCustomizations.find(
          (c: any) => c.option_id === qo.option_id
        );
        return {
          option_id: qo.option_id,
          quantity: qo.quantity,
          unit_price: qo.unit_price,
          delivery_days_impact: qo.delivery_days_impact || 0,
          customization_notes: customization?.notes || '',
        };
      }) || [],
      selected_upgrades: quotation.quotation_upgrades?.map((qu: any) => ({
        upgrade_id: qu.upgrade_id,
        memorial_item_id: qu.memorial_item_id,
        name: qu.memorial_upgrade?.name || '',
        price: qu.price,
        delivery_days_impact: qu.delivery_days_impact || 0,
        customization_notes: qu.customization_notes || '',
      })) || [],
      customizations: quotation.quotation_customizations?.filter(
        (qc: any) => !qc.option_id
      ).map((qc: any) => ({
        memorial_item_id: qc.memorial_item_id || `free-${qc.id}`,
        item_name: qc.item_name,
        notes: qc.notes || '',
        quantity: qc.quantity,
        is_free_customization: !qc.memorial_item_id,
        workflow_status: qc.workflow_status,
        pm_final_price: qc.pm_final_price,
        pm_final_delivery_impact_days: qc.pm_final_delivery_impact_days,
      })) || [],
    });
  }, []);

  const totals = useMemo(() => {
    const optionsTotal = (state.selected_options || []).reduce(
      (sum, option) => sum + option.unit_price * option.quantity,
      0
    );
    
    const upgradesTotal = (state.selected_upgrades || []).reduce(
      (sum, upgrade) => sum + upgrade.price,
      0
    );
    
    const customizationsTotal = (state.customizations || [])
      .filter(c => c.workflow_status === 'approved' && c.pm_final_price)
      .reduce((sum, c) => sum + (c.pm_final_price || 0), 0);
    
    const maxOptionsDeliveryImpact = (state.selected_options || []).reduce(
      (max, option) => Math.max(max, option.delivery_days_impact || 0),
      0
    );

    const maxUpgradesDeliveryImpact = (state.selected_upgrades || []).reduce(
      (max, upgrade) => Math.max(max, upgrade.delivery_days_impact || 0),
      0
    );

    const maxCustomizationDeliveryImpact = (state.customizations || [])
      .filter(c => c.workflow_status === 'approved' && c.pm_final_delivery_impact_days)
      .reduce((max, c) => Math.max(max, c.pm_final_delivery_impact_days || 0), 0);

    const totalDeliveryImpact = Math.max(
      maxOptionsDeliveryImpact,
      maxUpgradesDeliveryImpact,
      maxCustomizationDeliveryImpact
    );

    const baseDiscountAmount = state.base_price * (state.base_discount_percentage / 100);
    const finalBasePrice = state.base_price - baseDiscountAmount;
    
    const optionsDiscountAmount = optionsTotal * (state.options_discount_percentage / 100);
    const finalOptionsPrice = optionsTotal - optionsDiscountAmount;

    return {
      totalPrice: finalBasePrice + finalOptionsPrice + upgradesTotal + customizationsTotal,
      totalDeliveryDays: state.base_delivery_days + totalDeliveryImpact,
      optionsPrice: optionsTotal,
      upgradesPrice: upgradesTotal,
      customizationsPrice: customizationsTotal,
      finalBasePrice,
      finalOptionsPrice,
      baseDiscountAmount,
      optionsDiscountAmount,
    };
  }, [state]);

  return {
    state,
    setCommission,
    setYachtModel,
    addOption,
    removeOption,
    updateOptionQuantity,
    updateOptionCustomization,
    selectUpgrade,
    removeUpgrade,
    getSelectedUpgradeForItem,
    setBaseDiscount,
    setOptionsDiscount,
    addCustomization,
    removeCustomization,
    getCustomization,
    clearConfiguration,
    loadFromQuotation,
    totals,
  };
}