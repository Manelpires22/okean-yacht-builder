import { useState, useCallback } from "react";

export type Currency = "EUR" | "USD";
export type SimulatorStep = "list" | "seller" | "client" | "model" | "simulation";

export interface SimulatorState {
  // Etapa atual do wizard
  currentStep: SimulatorStep;
  
  // Vendedor/Comissão selecionado
  selectedCommissionId: string | null;
  selectedCommissionName: string;
  selectedCommissionPercent: number;
  selectedCommissionType: string;
  
  // Cliente selecionado
  selectedClientId: string | null;
  selectedClientName: string;
  
  // Modelo selecionado
  selectedModelId: string | null;
  selectedModelName: string;
  selectedModelCode: string;
  isExportable: boolean;
  
  // Exportação
  isExporting: boolean; // Se está exportando (mesmo sendo exportável, pode vender nacional)
  exportCountry: string | null;
  
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
  royaltiesPercent: number;
  
  // Inputs editáveis pelo usuário
  faturamentoBruto: number;
  transporteCost: number;
  customizacoesEstimadas: number;
  
  // Preço original de tabela (para cálculo de desconto)
  originalBasePrice: number;
}

const DEFAULT_STATE: SimulatorState = {
  currentStep: "list",
  
  selectedCommissionId: null,
  selectedCommissionName: "",
  selectedCommissionPercent: 0,
  selectedCommissionType: "",
  
  selectedClientId: null,
  selectedClientName: "",
  
  selectedModelId: null,
  selectedModelName: "",
  selectedModelCode: "",
  isExportable: false,
  
  isExporting: false,
  exportCountry: null,
  
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
  royaltiesPercent: 0.6,
  
  faturamentoBruto: 0,
  transporteCost: 0,
  customizacoesEstimadas: 0,
  originalBasePrice: 0,
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
      currentStep: "client",
    }));
  }, []);

  const selectClient = useCallback((client: {
    id: string;
    name: string;
  }) => {
    setState(prev => ({
      ...prev,
      selectedClientId: client.id,
      selectedClientName: client.name,
      currentStep: "model",
    }));
  }, []);

  const selectModel = useCallback((model: {
    id: string;
    name: string;
    code: string;
    basePrice: number;
    isExportable: boolean;
    isExporting: boolean;
    exportCountry: string | null;
    custoMpImport: number;
    custoMpImportCurrency: Currency;
    custoMpNacional: number;
    custoMoHoras: number;
    custoMoValorHora: number;
    taxImportPercent: number;
    salesTaxPercent: number;
    warrantyPercent: number;
    royaltiesPercent: number;
  }) => {
    setState(prev => ({
      ...prev,
      selectedModelId: model.id,
      selectedModelName: model.name,
      selectedModelCode: model.code,
      isExportable: model.isExportable,
      isExporting: model.isExporting,
      exportCountry: model.exportCountry,
      custoMpImport: model.custoMpImport,
      custoMpImportCurrency: model.custoMpImportCurrency,
      custoMpNacional: model.custoMpNacional,
      custoMoHoras: model.custoMoHoras,
      custoMoValorHora: model.custoMoValorHora,
      taxImportPercent: model.taxImportPercent,
      salesTaxPercent: model.salesTaxPercent,
      warrantyPercent: model.warrantyPercent,
      royaltiesPercent: model.royaltiesPercent,
      faturamentoBruto: model.basePrice,
      transporteCost: 0,
      customizacoesEstimadas: 0,
      originalBasePrice: model.basePrice,
      currentStep: "simulation",
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const loadFromSimulation = useCallback((simulation: {
    commissionId: string | null;
    commissionName: string;
    commissionPercent: number;
    commissionType: string;
    clientId: string | null;
    clientName: string;
    modelId: string | null;
    modelName: string;
    modelCode: string;
    isExporting: boolean;
    exportCountry: string | null;
    eurRate: number;
    usdRate: number;
    custoMpImport: number;
    custoMpImportCurrency: Currency;
    custoMpNacional: number;
    custoMoHoras: number;
    custoMoValorHora: number;
    taxImportPercent: number;
    salesTaxPercent: number;
    warrantyPercent: number;
    royaltiesPercent: number;
    faturamentoBruto: number;
    transporteCost: number;
    customizacoesEstimadas: number;
    originalBasePrice?: number;
  }) => {
    setState({
      currentStep: "simulation",
      selectedCommissionId: simulation.commissionId,
      selectedCommissionName: simulation.commissionName,
      selectedCommissionPercent: simulation.commissionPercent,
      selectedCommissionType: simulation.commissionType,
      selectedClientId: simulation.clientId,
      selectedClientName: simulation.clientName,
      selectedModelId: simulation.modelId,
      selectedModelName: simulation.modelName,
      selectedModelCode: simulation.modelCode,
      isExportable: simulation.isExporting,
      isExporting: simulation.isExporting,
      exportCountry: simulation.exportCountry,
      eurRate: simulation.eurRate,
      usdRate: simulation.usdRate,
      custoMpImport: simulation.custoMpImport,
      custoMpImportCurrency: simulation.custoMpImportCurrency,
      custoMpNacional: simulation.custoMpNacional,
      custoMoHoras: simulation.custoMoHoras,
      custoMoValorHora: simulation.custoMoValorHora,
      taxImportPercent: simulation.taxImportPercent,
      salesTaxPercent: simulation.salesTaxPercent,
      warrantyPercent: simulation.warrantyPercent,
      royaltiesPercent: simulation.royaltiesPercent,
      faturamentoBruto: simulation.faturamentoBruto,
      transporteCost: simulation.transporteCost,
      customizacoesEstimadas: simulation.customizacoesEstimadas,
      originalBasePrice: simulation.originalBasePrice ?? simulation.faturamentoBruto,
    });
  }, []);

  const resetToOriginal = useCallback(() => {
    setState(prev => ({
      ...prev,
      faturamentoBruto: prev.originalBasePrice,
      transporteCost: 0,
      customizacoesEstimadas: 0,
    }));
  }, []);

  return {
    state,
    updateField,
    selectCommission,
    selectClient,
    selectModel,
    goToStep,
    resetState,
    loadFromSimulation,
    resetToOriginal,
  };

  return {
    state,
    updateField,
    goToStep,
    selectCommission,
    selectClient,
    selectModel,
    resetState,
    loadFromSimulation,
  };
}
