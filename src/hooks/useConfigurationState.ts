import { useState, useEffect, useMemo } from "react";

export interface SelectedOption {
  option_id: string;
  quantity: number;
  unit_price: number;
  delivery_days_impact: number;
}

export interface ConfigurationState {
  yacht_model_id: string | null;
  base_price: number;
  base_delivery_days: number;
  selected_options: SelectedOption[];
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
        };
      }
    }
    return {
      yacht_model_id: null,
      base_price: 0,
      base_delivery_days: 0,
      selected_options: [],
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
    });
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

  const clearConfiguration = () => {
    setState({
      yacht_model_id: null,
      base_price: 0,
      base_delivery_days: 0,
      selected_options: [],
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

    return {
      totalPrice: state.base_price + optionsTotal,
      totalDeliveryDays: state.base_delivery_days + maxDeliveryImpact,
      optionsPrice: optionsTotal,
    };
  }, [state]);

  return {
    state,
    setYachtModel,
    addOption,
    removeOption,
    updateOptionQuantity,
    clearConfiguration,
    totals,
  };
}
