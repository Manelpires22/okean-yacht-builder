import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SimulatorLayout } from "@/components/simulator/SimulatorLayout";
import { MDCSimulationPanel } from "@/components/simulator/MDCSimulationPanel";
import { SellerSelector } from "@/components/simulator/SellerSelector";
import { ClientSelector } from "@/components/simulator/ClientSelector";
import { SimulatorModelSelector } from "@/components/simulator/SimulatorModelSelector";
import { SimulationsList } from "@/components/simulator/SimulationsList";
import { useSimulatorState, type Currency, type ExportCurrency } from "@/hooks/useSimulatorState";
import type { Simulation } from "@/hooks/useSimulations";
import type { SimulatorPreloadData } from "@/types/simulator-preload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Simulations() {
  const location = useLocation();
  const { state, updateField, selectCommission, selectClient, selectModel, goToStep, resetState, loadFromSimulation, resetToOriginal } = useSimulatorState();

  // Helper to fetch current model base price
  const fetchCurrentModelPrice = async (yachtModelId: string | null): Promise<number | null> => {
    if (!yachtModelId) return null;
    
    const { data: model } = await supabase
      .from('yacht_models')
      .select('base_price')
      .eq('id', yachtModelId)
      .maybeSingle();
    
    return model?.base_price ?? null;
  };

  // ✅ Carregar dados do configurador se vier via router state
  useEffect(() => {
    const preloadData = (location.state as { preloadFromQuotation?: SimulatorPreloadData })?.preloadFromQuotation;
    
    if (preloadData) {
      loadQuotationIntoSimulator(preloadData);
      // Limpar state para não recarregar em refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadQuotationIntoSimulator = async (data: SimulatorPreloadData) => {
    try {
      // 1. Buscar custos do modelo
      const { data: modelCosts } = await supabase
        .from('simulator_model_costs')
        .select('*')
        .eq('yacht_model_id', data.modelId)
        .maybeSingle();

      // 2. Buscar regras de negócio
      const { data: rules } = await supabase
        .from('simulator_business_rules')
        .select('*');

      const rulesMap: Record<string, number> = {};
      rules?.forEach((r: any) => {
        rulesMap[r.rule_key] = r.rule_value;
      });

      // 3. Buscar taxas de câmbio
      const { data: exchangeRates } = await supabase
        .from('simulator_exchange_rates')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(2);

      let eurRate = 6.0;
      let usdRate = 5.0;
      exchangeRates?.forEach((rate: any) => {
        if (rate.currency === 'EUR') eurRate = rate.rate;
        if (rate.currency === 'USD') usdRate = rate.rate;
      });

      // 4. Buscar trade-in rules se tiver trade-in
      const tradeInRules = {
        operationCostPercent: rulesMap['trade_in_operation_cost'] ?? 3,
        commissionPercent: rulesMap['trade_in_commission'] ?? 5,
        commissionReduction: rulesMap['trade_in_commission_reduction'] ?? 0.5,
      };

      // 5. Carregar no estado do simulador
      loadFromSimulation({
        commissionId: data.commission?.id ?? null,
        commissionName: data.commission?.name ?? '',
        commissionPercent: data.commission?.percent ?? 0,
        commissionType: data.commission?.type ?? '',
        clientId: data.client?.id ?? null,
        clientName: data.client?.name ?? '',
        modelId: data.modelId,
        modelName: data.modelName,
        modelCode: data.modelCode,
        isExporting: false,
        exportCountry: null,
        exportCurrency: null,
        eurRate,
        usdRate,
        custoMpImport: modelCosts?.custo_mp_import ?? 0,
        custoMpImportCurrency: (modelCosts?.custo_mp_import_currency as Currency) ?? 'EUR',
        custoMpNacional: modelCosts?.custo_mp_nacional ?? 0,
        custoMoHoras: modelCosts?.custo_mo_horas ?? 0,
        custoMoValorHora: modelCosts?.custo_mo_valor_hora ?? 55,
        taxImportPercent: modelCosts?.tax_import_percent ?? 0,
        salesTaxPercent: rulesMap['sales_tax_domestic'] ?? 21,
        warrantyPercent: rulesMap['warranty_domestic'] ?? 3,
        royaltiesPercent: rulesMap['royalties_percent'] ?? 0.6,
        faturamentoBruto: data.faturamentoBruto,
        transporteCost: 0,
        customizacoesEstimadas: data.customizacoesEstimadas,
        originalBasePrice: data.originalBasePrice,
        // Trade-In
        hasTradeIn: data.tradeIn?.hasTradeIn ?? false,
        tradeInBrand: data.tradeIn?.tradeInBrand ?? '',
        tradeInModel: data.tradeIn?.tradeInModel ?? '',
        tradeInYear: data.tradeIn?.tradeInYear ?? null,
        tradeInEntryValue: data.tradeIn?.tradeInEntryValue ?? 0,
        tradeInRealValue: data.tradeIn?.tradeInRealValue ?? 0,
        tradeInOperationCostPercent: tradeInRules.operationCostPercent,
        tradeInCommissionPercent: tradeInRules.commissionPercent,
        tradeInCommissionReduction: tradeInRules.commissionReduction,
      });

      toast.success(`Dados da cotação ${data.quotationNumber} carregados no simulador`);
    } catch (error) {
      console.error('Erro ao carregar dados no simulador:', error);
      toast.error('Erro ao carregar dados da cotação no simulador');
      goToStep('list');
    }
  };

  const handleDuplicateSimulation = async (simulation: Simulation) => {
    // Fetch current model price from database
    const currentModelPrice = await fetchCurrentModelPrice(simulation.yacht_model_id);
    
    loadFromSimulation({
      commissionId: simulation.commission_id,
      commissionName: simulation.commission_name,
      commissionPercent: simulation.commission_percent,
      commissionType: simulation.commission_type || "",
      clientId: simulation.client_id,
      clientName: simulation.client_name,
      modelId: simulation.yacht_model_id,
      modelName: simulation.yacht_model_name,
      modelCode: simulation.yacht_model_code,
      isExporting: simulation.is_exporting || false,
      exportCountry: simulation.export_country,
      exportCurrency: simulation.export_currency as ExportCurrency | null,
      eurRate: simulation.eur_rate,
      usdRate: simulation.usd_rate,
      custoMpImport: simulation.custo_mp_import,
      custoMpImportCurrency: simulation.custo_mp_import_currency as Currency,
      custoMpNacional: simulation.custo_mp_nacional,
      custoMoHoras: simulation.custo_mo_horas,
      custoMoValorHora: simulation.custo_mo_valor_hora,
      taxImportPercent: simulation.tax_import_percent,
      salesTaxPercent: simulation.sales_tax_percent,
      warrantyPercent: simulation.warranty_percent,
      royaltiesPercent: simulation.royalties_percent,
      faturamentoBruto: simulation.faturamento_bruto,
      transporteCost: simulation.transporte_cost || 0,
      customizacoesEstimadas: simulation.customizacoes_estimadas || 0,
      adjustedCommissionPercent: simulation.adjusted_commission_percent,
      // Use current model price as original base price
      originalBasePrice: currentModelPrice ?? simulation.faturamento_bruto,
      // Trade-In fields
      hasTradeIn: simulation.has_trade_in ?? false,
      tradeInBrand: simulation.trade_in_brand ?? "",
      tradeInModel: simulation.trade_in_model ?? "",
      tradeInYear: simulation.trade_in_year ?? null,
      tradeInEntryValue: simulation.trade_in_entry_value ?? 0,
      tradeInRealValue: simulation.trade_in_real_value ?? 0,
      tradeInOperationCostPercent: simulation.trade_in_operation_cost_percent ?? 3,
      tradeInCommissionPercent: simulation.trade_in_commission_percent ?? 5,
      tradeInCommissionReduction: simulation.trade_in_commission_reduction_percent ?? 0.5,
    }); // Sem options = nova simulação (duplicar)
  };

  const handleEditSimulation = async (simulation: Simulation) => {
    // Fetch current model price from database
    const currentModelPrice = await fetchCurrentModelPrice(simulation.yacht_model_id);
    
    loadFromSimulation({
      commissionId: simulation.commission_id,
      commissionName: simulation.commission_name,
      commissionPercent: simulation.commission_percent,
      commissionType: simulation.commission_type || "",
      clientId: simulation.client_id,
      clientName: simulation.client_name,
      modelId: simulation.yacht_model_id,
      modelName: simulation.yacht_model_name,
      modelCode: simulation.yacht_model_code,
      isExporting: simulation.is_exporting || false,
      exportCountry: simulation.export_country,
      exportCurrency: simulation.export_currency as ExportCurrency | null,
      eurRate: simulation.eur_rate,
      usdRate: simulation.usd_rate,
      custoMpImport: simulation.custo_mp_import,
      custoMpImportCurrency: simulation.custo_mp_import_currency as Currency,
      custoMpNacional: simulation.custo_mp_nacional,
      custoMoHoras: simulation.custo_mo_horas,
      custoMoValorHora: simulation.custo_mo_valor_hora,
      taxImportPercent: simulation.tax_import_percent,
      salesTaxPercent: simulation.sales_tax_percent,
      warrantyPercent: simulation.warranty_percent,
      royaltiesPercent: simulation.royalties_percent,
      faturamentoBruto: simulation.faturamento_bruto,
      transporteCost: simulation.transporte_cost || 0,
      customizacoesEstimadas: simulation.customizacoes_estimadas || 0,
      adjustedCommissionPercent: simulation.adjusted_commission_percent,
      // Use current model price as original base price
      originalBasePrice: currentModelPrice ?? simulation.faturamento_bruto,
      // Trade-In fields
      hasTradeIn: simulation.has_trade_in ?? false,
      tradeInBrand: simulation.trade_in_brand ?? "",
      tradeInModel: simulation.trade_in_model ?? "",
      tradeInYear: simulation.trade_in_year ?? null,
      tradeInEntryValue: simulation.trade_in_entry_value ?? 0,
      tradeInRealValue: simulation.trade_in_real_value ?? 0,
      tradeInOperationCostPercent: simulation.trade_in_operation_cost_percent ?? 3,
      tradeInCommissionPercent: simulation.trade_in_commission_percent ?? 5,
      tradeInCommissionReduction: simulation.trade_in_commission_reduction_percent ?? 0.5,
    }, {
      isEditing: true,
      simulationId: simulation.id,
      simulationNumber: simulation.simulation_number,
    });
  };

  // Initial: List of saved simulations
  if (state.currentStep === "list") {
    return (
      <SimulationsList 
        onNewSimulation={() => goToStep("seller")} 
        onDuplicateSimulation={handleDuplicateSimulation}
        onEditSimulation={handleEditSimulation}
      />
    );
  }

  // Step 1: Seller selection
  if (state.currentStep === "seller") {
    return <SellerSelector onSelect={selectCommission} />;
  }

  // Step 2: Client selection
  if (state.currentStep === "client") {
    return (
      <ClientSelector 
        sellerName={state.selectedCommissionName}
        onSelect={selectClient}
        onBack={() => goToStep("seller")}
      />
    );
  }

  // Step 3: Model selection
  if (state.currentStep === "model") {
    return (
      <SimulatorModelSelector 
        sellerName={state.selectedCommissionName}
        onSelect={selectModel}
        onBack={() => goToStep("client")}
      />
    );
  }

  // Step 4: Full simulation with MDC Panel
  return (
    <SimulatorLayout state={state} onUpdateField={updateField} onReset={resetState}>
      <div className="p-6">
        <MDCSimulationPanel 
          state={state} 
          onUpdateField={updateField}
          onReset={resetState}
          onResetToOriginal={resetToOriginal}
        />
      </div>
    </SimulatorLayout>
  );
}
