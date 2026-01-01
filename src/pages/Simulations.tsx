import { SimulatorLayout } from "@/components/simulator/SimulatorLayout";
import { MDCSimulationPanel } from "@/components/simulator/MDCSimulationPanel";
import { SellerSelector } from "@/components/simulator/SellerSelector";
import { SimulatorModelSelector } from "@/components/simulator/SimulatorModelSelector";
import { useSimulatorState } from "@/hooks/useSimulatorState";

export default function Simulations() {
  const { state, updateField, selectCommission, selectModel, goToStep, resetState } = useSimulatorState();

  // Step 1: Seller selection
  if (state.currentStep === "seller") {
    return <SellerSelector onSelect={selectCommission} />;
  }

  // Step 2: Model selection
  if (state.currentStep === "model") {
    return (
      <SimulatorModelSelector 
        sellerName={state.selectedCommissionName}
        onSelect={selectModel}
        onBack={() => goToStep("seller")}
      />
    );
  }

  // Step 3: Full simulation with MDC Panel
  return (
    <SimulatorLayout state={state} onUpdateField={updateField} onReset={resetState}>
      <div className="p-6">
        <MDCSimulationPanel state={state} onUpdateField={updateField} />
      </div>
    </SimulatorLayout>
  );
}
