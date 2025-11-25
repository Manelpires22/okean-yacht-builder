import { useState, useEffect, useMemo } from "react";

export interface SelectedOption {
  option_id: string;
  quantity: number;
  unit_price: number;
  delivery_days_impact: number;
  customization_notes?: string; // Notes for customizing the option
}

export interface Customization {
  memorial_item_id: string;
  item_name: string;
  notes: string;
  quantity?: number;
  image_url?: string;
  is_free_customization?: boolean; // true for user-created customizations
  workflow_status?: string; // Status do workflow (pending_pm_review, approved, etc)
  pm_final_price?: number; // Preço final aprovado pelo PM
  pm_final_delivery_impact_days?: number; // Impacto no prazo aprovado pelo PM
}

export interface ConfigurationState {
  yacht_model_id: string | null;
  base_price: number;
  base_delivery_days: number;
  selected_options: SelectedOption[];
  base_discount_percentage: number;
  options_discount_percentage: number;
  customizations: Customization[];
}

const STORAGE_KEY = "yacht-configuration-draft";

export function useConfigurationState() {
  const [state, setState] = useState<ConfigurationState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Garantir que arrays sempre existam
        return {
          ...parsed,
          selected_options: Array.isArray(parsed.selected_options) ? parsed.selected_options : [],
          customizations: Array.isArray(parsed.customizations) ? parsed.customizations : [],
        };
      } catch {
        return {
          yacht_model_id: null,
          base_price: 0,
          base_delivery_days: 0,
          selected_options: [],
          base_discount_percentage: 0,
          options_discount_percentage: 0,
          customizations: [],
        };
      }
    }
    return {
      yacht_model_id: null,
      base_price: 0,
      base_delivery_days: 0,
      selected_options: [],
      base_discount_percentage: 0,
      options_discount_percentage: 0,
      customizations: [],
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setYachtModel = (modelId: string, basePrice: number, baseDeliveryDays: number) => {
    setState({
      yacht_model_id: modelId,
      base_price: basePrice,
      base_delivery_days: baseDeliveryDays,
      selected_options: [],
      base_discount_percentage: 0,
      options_discount_percentage: 0,
      customizations: [],
    });
  };

  const setBaseDiscount = (percentage: number) => {
    setState((prev) => ({
      ...prev,
      base_discount_percentage: Math.max(0, Math.min(100, percentage)),
    }));
  };

  const setOptionsDiscount = (percentage: number) => {
    setState((prev) => ({
      ...prev,
      options_discount_percentage: Math.max(0, Math.min(100, percentage)),
    }));
  };

  const addOption = (option: SelectedOption) => {
    setState((prev) => ({
      ...prev,
      selected_options: [...prev.selected_options, option],
    }));
  };

  const removeOption = (optionId: string) => {
    setState((prev) => ({
      ...prev,
      selected_options: prev.selected_options.filter((o) => o.option_id !== optionId),
    }));
  };

  const updateOptionQuantity = (optionId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      selected_options: prev.selected_options.map((o) =>
        o.option_id === optionId ? { ...o, quantity } : o
      ),
    }));
  };

  const updateOptionCustomization = (optionId: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      selected_options: prev.selected_options.map((o) =>
        o.option_id === optionId ? { ...o, customization_notes: notes } : o
      ),
    }));
  };

  const addCustomization = (customization: Customization) => {
    setState((prev) => ({
      ...prev,
      customizations: [
        ...prev.customizations.filter((c) => c.memorial_item_id !== customization.memorial_item_id),
        customization,
      ],
    }));
  };

  const removeCustomization = (itemId: string) => {
    setState((prev) => ({
      ...prev,
      customizations: prev.customizations.filter((c) => c.memorial_item_id !== itemId),
    }));
  };

  const getCustomization = (itemId: string) => {
    return state.customizations.find((c) => c.memorial_item_id === itemId);
  };

  const clearConfiguration = () => {
    setState({
      yacht_model_id: null,
      base_price: 0,
      base_delivery_days: 0,
      selected_options: [],
      base_discount_percentage: 0,
      options_discount_percentage: 0,
      customizations: [],
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const loadFromQuotation = (quotation: any) => {
    // Carregar dados da cotação existente
    setState({
      yacht_model_id: quotation.yacht_model_id,
      base_price: quotation.base_price || 0,
      base_delivery_days: quotation.base_delivery_days || 0,
      base_discount_percentage: quotation.base_discount_percentage || 0,
      options_discount_percentage: quotation.options_discount_percentage || 0,
      selected_options: quotation.quotation_options?.map((qo: any) => ({
        option_id: qo.option_id,
        quantity: qo.quantity,
        unit_price: qo.unit_price,
        delivery_days_impact: qo.delivery_days_impact || 0,
      })) || [],
      customizations: quotation.quotation_customizations?.map((qc: any) => ({
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
  };

  const totals = useMemo(() => {
    const optionsTotal = (state.selected_options || []).reduce(
      (sum, option) => sum + option.unit_price * option.quantity,
      0
    );
    
    // Calcular total de customizações aprovadas
    const customizationsTotal = (state.customizations || [])
      .filter(c => c.workflow_status === 'approved' && c.pm_final_price)
      .reduce((sum, c) => sum + (c.pm_final_price || 0), 0);
    
    const maxDeliveryImpact = (state.selected_options || []).reduce(
      (max, option) => Math.max(max, option.delivery_days_impact || 0),
      0
    );

    // Calcular máximo impacto de prazo de customizações aprovadas
    const maxCustomizationDeliveryImpact = (state.customizations || [])
      .filter(c => c.workflow_status === 'approved' && c.pm_final_delivery_impact_days)
      .reduce((max, c) => Math.max(max, c.pm_final_delivery_impact_days || 0), 0);

    const totalDeliveryImpact = Math.max(maxDeliveryImpact, maxCustomizationDeliveryImpact);

    // Calculate discounted prices
    const baseDiscountAmount = state.base_price * (state.base_discount_percentage / 100);
    const finalBasePrice = state.base_price - baseDiscountAmount;
    
    const optionsDiscountAmount = optionsTotal * (state.options_discount_percentage / 100);
    const finalOptionsPrice = optionsTotal - optionsDiscountAmount;

    return {
      totalPrice: finalBasePrice + finalOptionsPrice + customizationsTotal,
      totalDeliveryDays: state.base_delivery_days + totalDeliveryImpact,
      optionsPrice: optionsTotal,
      customizationsPrice: customizationsTotal,
      finalBasePrice,
      finalOptionsPrice,
      baseDiscountAmount,
      optionsDiscountAmount,
    };
  }, [state]);

  return {
    state,
    setYachtModel,
    addOption,
    removeOption,
    updateOptionQuantity,
    updateOptionCustomization,
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
