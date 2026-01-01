import { RefreshCw } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { SimulatorSidebar } from "./SimulatorSidebar";
import { SimulatorState } from "@/hooks/useSimulatorState";

interface SimulatorLayoutProps {
  children: React.ReactNode;
  state: SimulatorState;
  onUpdateField: <K extends keyof SimulatorState>(field: K, value: SimulatorState[K]) => void;
  onReset: () => void;
}

export function SimulatorLayout({ children, state, onUpdateField, onReset }: SimulatorLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        title="Simulador de Viabilidade" 
        actions={
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Nova Simulação
          </Button>
        }
      />
      
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-[calc(100vh-4rem)] w-full">
          <SimulatorSidebar state={state} onUpdateField={onUpdateField} />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
