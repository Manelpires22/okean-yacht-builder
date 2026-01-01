import { Calculator, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulatorState } from "@/hooks/useSimulatorState";

interface SimulationResultsPanelProps {
  state: SimulatorState;
}

export function SimulationResultsPanel({ state }: SimulationResultsPanelProps) {
  // Cálculos básicos de exemplo (serão refinados posteriormente)
  const laborCost = state.laborHours * state.laborCostPerHour;
  const totalDirectCosts = state.materialCost + laborCost + state.fixedCosts;
  
  // Placeholder para receita (será input do usuário ou baseado no modelo)
  const revenue = 0; // Será implementado no próximo passo
  
  const grossProfit = revenue - totalDirectCosts;
  const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10">
          <Calculator className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Simulação de Viabilidade
          </h1>
          <p className="text-muted-foreground">
            Configure os parâmetros na barra lateral para calcular a margem
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Preço de venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Custos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDirectCosts.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MP + MO + Fixos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lucro Bruto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${grossProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
              {grossProfit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita - Custos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Margem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${marginPercent >= 0 ? "text-green-600" : "text-destructive"}`}>
              {marginPercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MDC %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Breakdown de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Matéria-prima</span>
              <span className="font-medium">
                {state.materialCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                Mão de obra ({state.laborHours}h × R$ {state.laborCostPerHour})
              </span>
              <span className="font-medium">
                {laborCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Custos fixos</span>
              <span className="font-medium">
                {state.fixedCosts.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Impostos ({state.taxPercent}%)</span>
              <span className="font-medium text-muted-foreground">
                (calculado sobre receita)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Frete ({state.freightPercent}%)</span>
              <span className="font-medium text-muted-foreground">
                (calculado sobre receita)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Comissões ({state.royaltiesPercent + state.brokerCommissionPercent}%)</span>
              <span className="font-medium text-muted-foreground">
                (calculado sobre receita)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold text-lg">
              <span>Total de Custos</span>
              <span>
                {totalDirectCosts.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for next steps */}
      <div className="rounded-lg border-2 border-dashed border-muted p-8 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Próximos passos</p>
          <p className="text-sm mt-1">
            Seletor de modelo, input de faturamento e cálculo completo de MDC
          </p>
        </div>
      </div>
    </div>
  );
}
