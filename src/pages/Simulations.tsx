import { SimulatorLayout } from "@/components/simulator/SimulatorLayout";
import { MDCSimulationPanel } from "@/components/simulator/MDCSimulationPanel";
import { SellerSelector } from "@/components/simulator/SellerSelector";
import { ClientSelector } from "@/components/simulator/ClientSelector";
import { SimulatorModelSelector } from "@/components/simulator/SimulatorModelSelector";
import { SimulationsList } from "@/components/simulator/SimulationsList";
import { useSimulatorState, type Currency, type ExportCurrency } from "@/hooks/useSimulatorState";
import type { Simulation } from "@/hooks/useSimulations";

export default function Simulations() {
  const { state, updateField, selectCommission, selectClient, selectModel, goToStep, resetState, loadFromSimulation, resetToOriginal } = useSimulatorState();

  const handleDuplicateSimulation = (simulation: Simulation) => {
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
      // Comissão ajustada
      adjustedCommissionPercent: simulation.adjusted_commission_percent,
    }); // Sem options = nova simulação (duplicar)
  };

  const handleEditSimulation = (simulation: Simulation) => {
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
