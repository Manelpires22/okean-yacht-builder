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
  isExporting: boolean;
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
  
  // Percentual de desconto/acréscimo sobre tabela
  discountPercent: number;
  
  // Trade-In
  hasTradeIn: boolean;
  tradeInBrand: string;
  tradeInModel: string;
  tradeInYear: number | null;
  tradeInEntryValue: number;
  tradeInRealValue: number;
  
  // Trade-In Business Rules (editáveis por simulação)
  tradeInOperationCostPercent: number;
  tradeInCommissionPercent: number;
  tradeInCommissionReduction: number;
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
  discountPercent: 0,
  
  // Trade-In defaults
  hasTradeIn: false,
  tradeInBrand: "",
  tradeInModel: "",
  tradeInYear: null,
  tradeInEntryValue: 0,
  tradeInRealValue: 0,
  
  // Trade-In Business Rules defaults
  tradeInOperationCostPercent: 3,
  tradeInCommissionPercent: 5,
  tradeInCommissionReduction: 0.5,
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
    // Trade-In
    hasTradeIn?: boolean;
    tradeInBrand?: string;
    tradeInModel?: string;
    tradeInYear?: number | null;
    tradeInEntryValue?: number;
    tradeInRealValue?: number;
    // Trade-In Business Rules (from database)
    tradeInOperationCostPercent?: number;
    tradeInCommissionPercent?: number;
    tradeInCommissionReduction?: number;
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
      discountPercent: 0,
      // Trade-In
      hasTradeIn: model.hasTradeIn ?? false,
      tradeInBrand: model.tradeInBrand ?? "",
      tradeInModel: model.tradeInModel ?? "",
      tradeInYear: model.tradeInYear ?? null,
      tradeInEntryValue: model.tradeInEntryValue ?? 0,
      tradeInRealValue: model.tradeInRealValue ?? 0,
      // Trade-In rules from database (with fallback defaults)
      tradeInOperationCostPercent: model.tradeInOperationCostPercent ?? 3,
      tradeInCommissionPercent: model.tradeInCommissionPercent ?? 5,
      tradeInCommissionReduction: model.tradeInCommissionReduction ?? 0.5,
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
    // Trade-In
    hasTradeIn?: boolean;
    tradeInBrand?: string;
    tradeInModel?: string;
    tradeInYear?: number | null;
    tradeInEntryValue?: number;
    tradeInRealValue?: number;
    // Trade-In Business Rules
    tradeInOperationCostPercent?: number;
    tradeInCommissionPercent?: number;
    tradeInCommissionReduction?: number;
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
      discountPercent: simulation.originalBasePrice && simulation.originalBasePrice > 0
        ? ((simulation.faturamentoBruto - simulation.originalBasePrice) / simulation.originalBasePrice) * 100
        : 0,
      originalBasePrice: simulation.originalBasePrice ?? simulation.faturamentoBruto,
      // Trade-In
      hasTradeIn: simulation.hasTradeIn ?? false,
      tradeInBrand: simulation.tradeInBrand ?? "",
      tradeInModel: simulation.tradeInModel ?? "",
      tradeInYear: simulation.tradeInYear ?? null,
      tradeInEntryValue: simulation.tradeInEntryValue ?? 0,
      tradeInRealValue: simulation.tradeInRealValue ?? 0,
      // Trade-In Business Rules
      tradeInOperationCostPercent: simulation.tradeInOperationCostPercent ?? 3,
      tradeInCommissionPercent: simulation.tradeInCommissionPercent ?? 5,
      tradeInCommissionReduction: simulation.tradeInCommissionReduction ?? 0.5,
    });
  }, []);

  const resetToOriginal = useCallback(() => {
    setState(prev => ({
      ...prev,
      faturamentoBruto: prev.originalBasePrice,
      transporteCost: 0,
      customizacoesEstimadas: 0,
      discountPercent: 0,
      // Resetar trade-in também
      hasTradeIn: false,
      tradeInBrand: "",
      tradeInModel: "",
      tradeInYear: null,
      tradeInEntryValue: 0,
      tradeInRealValue: 0,
      // Reset trade-in rules to defaults
      tradeInOperationCostPercent: 3,
      tradeInCommissionPercent: 5,
      tradeInCommissionReduction: 0.5,
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
}
