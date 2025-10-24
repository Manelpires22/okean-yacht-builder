import { useState, useEffect, useMemo } from "react";

export interface SelectedOption {
  option_id: string;
  quantity: number;
  unit_price: number;
  delivery_days_impact: number;
}

export interface Customization {
  memorial_item_id: string;
  item_name: string;
  notes: string;
  quantity?: number;
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
        return JSON.parse(saved);
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

  const totals = useMemo(() => {
    const optionsTotal = state.selected_options.reduce(
      (sum, option) => sum + option.unit_price * option.quantity,
      0
    );
    
    const maxDeliveryImpact = state.selected_options.reduce(
      (max, option) => Math.max(max, option.delivery_days_impact || 0),
      0
    );

    // Calculate discounted prices
    const baseDiscountAmount = state.base_price * (state.base_discount_percentage / 100);
    const finalBasePrice = state.base_price - baseDiscountAmount;
    
    const optionsDiscountAmount = optionsTotal * (state.options_discount_percentage / 100);
    const finalOptionsPrice = optionsTotal - optionsDiscountAmount;

    return {
      totalPrice: finalBasePrice + finalOptionsPrice,
      totalDeliveryDays: state.base_delivery_days + maxDeliveryImpact,
      optionsPrice: optionsTotal,
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
    setBaseDiscount,
    setOptionsDiscount,
    addCustomization,
    removeCustomization,
    getCustomization,
    clearConfiguration,
    totals,
  };
}
