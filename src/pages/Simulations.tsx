import { SimulatorLayout } from "@/components/simulator/SimulatorLayout";
import { MDCSimulationPanel } from "@/components/simulator/MDCSimulationPanel";
import { SellerSelector } from "@/components/simulator/SellerSelector";
import { ClientSelector } from "@/components/simulator/ClientSelector";
import { SimulatorModelSelector } from "@/components/simulator/SimulatorModelSelector";
import { SimulationsList } from "@/components/simulator/SimulationsList";
import { useSimulatorState, type Currency, type ExportCurrency } from "@/hooks/useSimulatorState";
import type { Simulation } from "@/hooks/useSimulations";
import { supabase } from "@/integrations/supabase/client";

export default function Simulations() {
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
