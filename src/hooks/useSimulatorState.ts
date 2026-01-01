import { useState, useCallback } from "react";

export type Currency = "EUR" | "USD";
export type SimulatorStep = "seller" | "model" | "simulation";

export interface SimulatorState {
  // Etapa atual do wizard
  currentStep: SimulatorStep;
  
  // Vendedor/Comissão selecionado
  selectedCommissionId: string | null;
  selectedCommissionName: string;
  selectedCommissionPercent: number;
  selectedCommissionType: string;
  
  // Modelo selecionado
  selectedModelId: string | null;
  selectedModelName: string;
  selectedModelCode: string;
  isExportable: boolean;
  
  // Câmbio
  eurRate: number;
  usdRate: number;
  
  // Custos do modelo (carregados automaticamente)
  custoMpImport: number;
  custoMpImportCurrency: Currency;
  custoMpNacional: number;
  custoMoHoras: number;
  custoMoValorHora: number;
  taxImportPercent: number;
  
  // Taxas (calculadas pelas regras de negócio)
  salesTaxPercent: number;
  warrantyPercent: number;
}

const DEFAULT_STATE: SimulatorState = {
  currentStep: "seller",
  
  selectedCommissionId: null,
  selectedCommissionName: "",
  selectedCommissionPercent: 0,
  selectedCommissionType: "",
  
  selectedModelId: null,
  selectedModelName: "",
  selectedModelCode: "",
  isExportable: false,
  
  eurRate: 6.0,
  usdRate: 5.0,
  
  custoMpImport: 0,
  custoMpImportCurrency: "EUR",
  custoMpNacional: 0,
  custoMoHoras: 0,
  custoMoValorHora: 55,
  taxImportPercent: 0,
  
  salesTaxPercent: 21,
  warrantyPercent: 3,
};

export function useSimulatorState() {
  const [state, setState] = useState<SimulatorState>(DEFAULT_STATE);

  const updateField = useCallback(<K extends keyof SimulatorState>(
    field: K,
    value: SimulatorState[K]
  ) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  const goToStep = useCallback((step: SimulatorStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const selectCommission = useCallback((commission: {
    id: string;
    name: string;
    percent: number;
    type: string;
  }) => {
    setState(prev => ({
      ...prev,
      selectedCommissionId: commission.id,
      selectedCommissionName: commission.name,
      selectedCommissionPercent: commission.percent,
      selectedCommissionType: commission.type,
      currentStep: "model",
    }));
  }, []);

  const selectModel = useCallback((model: {
    id: string;
    name: string;
    code: string;
    isExportable: boolean;
    custoMpImport: number;
    custoMpImportCurrency: Currency;
    custoMpNacional: number;
    custoMoHoras: number;
    custoMoValorHora: number;
    taxImportPercent: number;
    salesTaxPercent: number;
    warrantyPercent: number;
  }) => {
    setState(prev => ({
      ...prev,
      selectedModelId: model.id,
      selectedModelName: model.name,
      selectedModelCode: model.code,
      isExportable: model.isExportable,
      custoMpImport: model.custoMpImport,
      custoMpImportCurrency: model.custoMpImportCurrency,
      custoMpNacional: model.custoMpNacional,
      custoMoHoras: model.custoMoHoras,
      custoMoValorHora: model.custoMoValorHora,
      taxImportPercent: model.taxImportPercent,
      salesTaxPercent: model.salesTaxPercent,
      warrantyPercent: model.warrantyPercent,
      currentStep: "simulation",
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return {
    state,
    updateField,
    goToStep,
    selectCommission,
    selectModel,
    resetState,
  };
}
