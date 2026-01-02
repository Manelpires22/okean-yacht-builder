import { SimulatorLayout } from "@/components/simulator/SimulatorLayout";
import { MDCSimulationPanel } from "@/components/simulator/MDCSimulationPanel";
import { SellerSelector } from "@/components/simulator/SellerSelector";
import { ClientSelector } from "@/components/simulator/ClientSelector";
import { SimulatorModelSelector } from "@/components/simulator/SimulatorModelSelector";
import { useSimulatorState } from "@/hooks/useSimulatorState";

export default function Simulations() {
  const { state, updateField, selectCommission, selectClient, selectModel, goToStep, resetState } = useSimulatorState();

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
        />
      </div>
    </SimulatorLayout>
  );
}
