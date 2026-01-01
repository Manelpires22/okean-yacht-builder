import { useState } from "react";
import { Calculator } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ExchangeRateCard } from "@/components/simulator/ExchangeRateCard";

export default function Simulations() {
  const [eurRate, setEurRate] = useState(6.0);
  const [usdRate, setUsdRate] = useState(5.0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Simulador de Viabilidade" />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Simulador de Viabilidade
            </h1>
            <p className="text-muted-foreground">
              Analise a margem e viabilidade financeira antes de enviar a cotação
            </p>
          </div>
        </div>

        {/* Grid de Cards de Câmbio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ExchangeRateCard 
            currency="EUR"
            onRateChange={setEurRate}
            currentRate={eurRate}
          />
          <ExchangeRateCard 
            currency="USD"
            onRateChange={setUsdRate}
            currentRate={usdRate}
          />
        </div>

        {/* Placeholder para próximos passos */}
        <div className="rounded-lg border-2 border-dashed border-muted p-8 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Próximos passos</p>
            <p className="text-sm mt-1">
              Seletor de modelo, custos e cálculo de margem
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
