import { useState, useCallback } from "react";

export type Currency = "EUR" | "USD";

export interface SimulatorState {
  // Câmbio
  eurRate: number;
  usdRate: number;
  
  // Modelo selecionado
  selectedModelId: string | null;
  
  // Custos (inputs)
  materialCost: number;
  laborHours: number;
  laborCostPerHour: number;
  fixedCosts: number;
  
  // Taxas (%)
  taxPercent: number;
  freightPercent: number;
  warrantyPercent: number;
  
  // Comissões (%)
  royaltiesPercent: number;
  brokerCommissionPercent: number;
  
  // Trade-in
  tradeInValue: number;
  tradeInResult: number;
}

const DEFAULT_STATE: SimulatorState = {
  eurRate: 6.0,
  usdRate: 5.0,
  selectedModelId: null,
  materialCost: 0,
  laborHours: 0,
  laborCostPerHour: 150,
  fixedCosts: 0,
  taxPercent: 21,
  freightPercent: 2,
  warrantyPercent: 3,
  royaltiesPercent: 5,
  brokerCommissionPercent: 3,
  tradeInValue: 0,
  tradeInResult: 0,
};

export function useSimulatorState() {
  const [state, setState] = useState<SimulatorState>(DEFAULT_STATE);

  const updateField = useCallback(<K extends keyof SimulatorState>(
    field: K,
    value: SimulatorState[K]
  ) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetState = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    state,
    updateField,
    resetState,
  };
}
