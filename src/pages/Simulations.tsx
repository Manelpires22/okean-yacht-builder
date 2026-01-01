import { SimulatorLayout } from "@/components/simulator/SimulatorLayout";
import { SimulationResultsPanel } from "@/components/simulator/SimulationResultsPanel";
import { useSimulatorState } from "@/hooks/useSimulatorState";

export default function Simulations() {
  const { state, updateField } = useSimulatorState();

  return (
    <SimulatorLayout state={state} onUpdateField={updateField}>
      <SimulationResultsPanel state={state} />
    </SimulatorLayout>
  );
}
