import { Calculator, TrendingUp, TrendingDown, DollarSign, Percent, Ship, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimulatorState } from "@/hooks/useSimulatorState";

interface SimulationResultsPanelProps {
  state: SimulatorState;
}

export function SimulationResultsPanel({ state }: SimulationResultsPanelProps) {
  // Converter MP Importada para BRL
  const exchangeRate = state.custoMpImportCurrency === "EUR" ? state.eurRate : state.usdRate;
  const custoMpImportBRL = state.custoMpImport * exchangeRate;
  
  // Custo de mão de obra
  const laborCost = state.custoMoHoras * state.custoMoValorHora;
  
  // Custo de importação
  const impostoImportacao = custoMpImportBRL * (state.taxImportPercent / 100);
  
  // Custo total de produção
  const totalProductionCost = custoMpImportBRL + impostoImportacao + state.custoMpNacional + laborCost;
  
  // Placeholder para receita (será input do usuário)
  const revenue = 0;
  
  // Custos sobre receita
  const salesTax = revenue * (state.salesTaxPercent / 100);
  const warranty = revenue * (state.warrantyPercent / 100);
  const commission = revenue * (state.selectedCommissionPercent / 100);
  
  const totalCosts = totalProductionCost + salesTax + warranty + commission;
  const grossProfit = revenue - totalCosts;
  const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header with selected seller and model */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Simulação de Viabilidade
            </h1>
            <p className="text-muted-foreground">
              Análise de margem de contribuição
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1.5 py-1.5">
            <User className="h-3.5 w-3.5" />
            {state.selectedCommissionName} ({state.selectedCommissionPercent}%)
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1.5 py-1.5">
            <Ship className="h-3.5 w-3.5" />
            {state.selectedModelCode} - {state.selectedModelName}
          </Badge>
          {state.isExportable && (
            <Badge variant="default">Exportação</Badge>
          )}
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
              Custo Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProductionCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MP + MO + Impostos
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
              Margem MDC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${marginPercent >= 0 ? "text-green-600" : "text-destructive"}`}>
              {marginPercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MDC / Receita
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
            {/* Custos de Produção */}
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pb-1">
              Custos de Produção
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                MP Importada ({state.custoMpImportCurrency} {state.custoMpImport.toLocaleString()} × {exchangeRate.toFixed(2)})
              </span>
              <span className="font-medium">
                {custoMpImportBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                Custo Importação ({state.taxImportPercent}%)
              </span>
              <span className="font-medium">
                {impostoImportacao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">MP Nacional</span>
              <span className="font-medium">
                {state.custoMpNacional.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                Mão de obra ({state.custoMoHoras}h × R$ {state.custoMoValorHora})
              </span>
              <span className="font-medium">
                {laborCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            
            {/* Custos sobre Receita */}
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-4 pb-1">
              Custos sobre Receita
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                Imposto de Venda ({state.salesTaxPercent}%)
                {state.isExportable && <span className="ml-1 text-xs">(Exportação)</span>}
              </span>
              <span className="font-medium">
                {salesTax.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                Garantia ({state.warrantyPercent}%)
              </span>
              <span className="font-medium">
                {warranty.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                Comissão - {state.selectedCommissionName} ({state.selectedCommissionPercent}%)
              </span>
              <span className="font-medium">
                {commission.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            
            {/* Total */}
            <div className="flex justify-between items-center py-2 font-bold text-lg pt-4">
              <span>Total de Custos</span>
              <span>
                {totalCosts.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for revenue input */}
      <div className="rounded-lg border-2 border-dashed border-muted p-8 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Próximo passo</p>
          <p className="text-sm mt-1">
            Input de faturamento para cálculo completo de MDC
          </p>
        </div>
      </div>
    </div>
  );
}
