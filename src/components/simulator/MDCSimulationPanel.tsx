import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Home, TrendingUp, TrendingDown, Save, RotateCcw, User } from "lucide-react";
import { SimulatorState } from "@/hooks/useSimulatorState";
import { CurrencyInput } from "@/components/ui/numeric-input";
import { useSaveSimulation } from "@/hooks/useSimulations";

interface MDCSimulationPanelProps {
  state: SimulatorState;
  onUpdateField: <K extends keyof SimulatorState>(field: K, value: SimulatorState[K]) => void;
  onReset?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface SimulationLineProps {
  label: string;
  value: number;
  percent?: number;
  isEditable?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
  isNegative?: boolean;
  detail?: string;
  editableField?: keyof Pick<SimulatorState, 'faturamentoBruto' | 'transporteCost' | 'customizacoesEstimadas'>;
  onUpdateField?: <K extends keyof SimulatorState>(field: K, value: SimulatorState[K]) => void;
}

function SimulationLine({
  label,
  value,
  percent,
  isEditable,
  isTotal,
  isSubtotal,
  isNegative,
  detail,
  editableField,
  onUpdateField,
}: SimulationLineProps) {
  const valueColor = isNegative
    ? "text-destructive"
    : value < 0
    ? "text-destructive"
    : isTotal
    ? "text-primary font-bold"
    : isSubtotal
    ? "font-semibold"
    : "";

  return (
    <div
      className={`flex items-center justify-between py-2 ${
        isTotal ? "bg-muted/50 -mx-4 px-4 rounded" : ""
      } ${isSubtotal ? "border-t border-border pt-3" : ""}`}
    >
      <div className="flex flex-col">
        <span
          className={`text-sm ${
            isTotal ? "font-bold text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
          {percent !== undefined && ` (${formatPercent(percent)})`}
        </span>
        {detail && (
          <span className="text-xs text-muted-foreground/70">{detail}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isEditable && editableField && onUpdateField ? (
          <CurrencyInput
            value={String(value)}
            onChange={(v) => onUpdateField(editableField, parseFloat(v) || 0)}
            className="w-48 text-right font-mono bg-primary/5 border-primary/20"
          />
        ) : (
          <span className={`font-mono text-sm ${valueColor}`}>
            {isNegative && value > 0 && "- "}
            {formatCurrency(Math.abs(value))}
          </span>
        )}
      </div>
    </div>
  );
}

export function MDCSimulationPanel({
  state,
  onUpdateField,
  onReset,
}: MDCSimulationPanelProps) {
  const [notes, setNotes] = useState("");
  const saveSimulation = useSaveSimulation();
  
  // Câmbio para conversão
  const exchangeRate =
    state.custoMpImportCurrency === "EUR" ? state.eurRate : state.usdRate;

  // MDC ideal fixa em 30%
  const MDC_IDEAL = 30;

  // Cálculos de FATURAMENTO com comissão variável
  const calculations = useMemo(() => {
    const fatBruto = state.faturamentoBruto;
    const comissaoBase = state.selectedCommissionPercent;

    // Deduções sobre faturamento (com comissão BASE para calcular MDC referência)
    const taxValue = fatBruto * (state.salesTaxPercent / 100);
    const comissaoBaseValue = fatBruto * (comissaoBase / 100);
    const royaltiesValue = fatBruto * (state.royaltiesPercent / 100);
    const transporteValue = state.transporteCost;

    // Faturamento Líquido (com comissão base)
    const fatLiquidoBase =
      fatBruto - taxValue - transporteValue - comissaoBaseValue - royaltiesValue;

    // Custos de Matéria Prima
    const mpImportBRL = state.custoMpImport * exchangeRate;
    const mpLiquida = mpImportBRL + state.custoMpNacional;
    const taxImport = mpImportBRL * (state.taxImportPercent / 100);
    const customizacoes = state.customizacoesEstimadas;
    const mpTotal = mpLiquida + taxImport + customizacoes;

    // Mão de Obra
    const maoDeObra = state.custoMoHoras * state.custoMoValorHora;

    // Custo da Venda
    const custoVenda = mpTotal + maoDeObra;

    // Garantia
    const garantiaValue = fatBruto * (state.warrantyPercent / 100);

    // MDC de referência (com comissão base) para calcular o ajuste
    const margemBrutaRef = fatLiquidoBase - custoVenda - garantiaValue;
    const margemPercentRef = fatLiquidoBase > 0 ? (margemBrutaRef / fatLiquidoBase) * 100 : 0;

    // Calcular fator de ajuste: (MDC Real - 30%) / 30%
    const adjustmentFactor = (margemPercentRef - MDC_IDEAL) / MDC_IDEAL;

    // Comissão ajustada = Comissão Base × (1 + Fator)
    const comissaoAjustadaPercent = comissaoBase * (1 + adjustmentFactor);
    const comissaoAjustadaValue = fatBruto * (comissaoAjustadaPercent / 100);

    // RECALCULAR Fat. Líquido com comissão ajustada
    const fatLiquido =
      fatBruto - taxValue - transporteValue - comissaoAjustadaValue - royaltiesValue;

    // MDC Final (com comissão ajustada)
    const margemBruta = fatLiquido - custoVenda - garantiaValue;
    const margemPercent = fatLiquido > 0 ? (margemBruta / fatLiquido) * 100 : 0;

    return {
      fatBruto,
      taxValue,
      transporteValue,
      comissaoBase,
      comissaoBaseValue,
      comissaoAjustadaPercent,
      comissaoAjustadaValue,
      adjustmentFactor,
      royaltiesValue,
      fatLiquido,
      mpImportBRL,
      mpLiquida,
      taxImport,
      customizacoes,
      mpTotal,
      maoDeObra,
      custoVenda,
      garantiaValue,
      margemBruta,
      margemPercent,
      margemPercentRef,
    };
  }, [state, exchangeRate]);

  const isPositiveMargin = calculations.margemBruta >= 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Simulação MDC - {state.selectedModelCode}
          </CardTitle>
          <div className="flex items-center gap-2">
            {state.isExporting ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Export: {state.exportCountry?.toUpperCase()}
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                Nacional
              </Badge>
            )}
            <Badge variant="outline">
              {state.selectedCommissionName} ({formatPercent(state.selectedCommissionPercent)})
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* FATURAMENTO */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Faturamento
          </h3>
          <div className="space-y-1">
            <SimulationLine
              label="FAT. BRUTO"
              value={calculations.fatBruto}
              isEditable
              editableField="faturamentoBruto"
              onUpdateField={onUpdateField}
            />
            <SimulationLine
              label="TAX"
              value={calculations.taxValue}
              percent={state.salesTaxPercent}
              isNegative
            />
            <SimulationLine
              label="TRANSPORTE"
              value={calculations.transporteValue}
              isEditable
              editableField="transporteCost"
              onUpdateField={onUpdateField}
              isNegative
            />
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  COMISSÃO ({formatPercent(calculations.comissaoAjustadaPercent)})
                  {calculations.adjustmentFactor !== 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${calculations.adjustmentFactor > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {calculations.adjustmentFactor > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  base: {formatPercent(calculations.comissaoBase)}, ajuste: {calculations.adjustmentFactor >= 0 ? '+' : ''}{formatPercent(calculations.adjustmentFactor * 100)}
                </span>
              </div>
              <span className="font-mono text-sm text-destructive">
                - {formatCurrency(calculations.comissaoAjustadaValue)}
              </span>
            </div>
            <SimulationLine
              label="ROYALTIES"
              value={calculations.royaltiesValue}
              percent={state.royaltiesPercent}
              isNegative
            />
            <SimulationLine
              label="FATURAMENTO LÍQ."
              value={calculations.fatLiquido}
              isSubtotal
            />
          </div>
        </div>

        <Separator />

        {/* CUSTOS */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Custos
          </h3>
          <div className="space-y-1">
            <SimulationLine
              label="MATÉRIA PRIMA LIQ."
              value={calculations.mpLiquida}
              detail={`MP Import (${formatCurrency(calculations.mpImportBRL)}) + MP Nacional (${formatCurrency(state.custoMpNacional)})`}
            />
            <SimulationLine
              label="TAX IMPORT"
              value={calculations.taxImport}
              percent={state.taxImportPercent}
            />
            <SimulationLine
              label="CUSTOMIZAÇÕES EST."
              value={calculations.customizacoes}
              isEditable
              editableField="customizacoesEstimadas"
              onUpdateField={onUpdateField}
            />
            <SimulationLine
              label="MATÉRIA PRIMA TOTAL"
              value={calculations.mpTotal}
              isSubtotal
            />
            <SimulationLine
              label="MÃO-DE-OBRA"
              value={calculations.maoDeObra}
              detail={`${state.custoMoHoras}h × ${formatCurrency(state.custoMoValorHora)}/h`}
            />
            <SimulationLine
              label="CUSTO DA VENDA"
              value={calculations.custoVenda}
              isSubtotal
            />
          </div>
        </div>

        <Separator />

        {/* RESULTADO */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Resultado
          </h3>
          <div className="space-y-1">
            <SimulationLine
              label="GARANTIA"
              value={calculations.garantiaValue}
              percent={state.warrantyPercent}
              isNegative
            />
            <div className="mt-4">
              <SimulationLine
                label="MARGEM BRUTA (MDC)"
                value={calculations.margemBruta}
                isTotal
              />
            </div>
          </div>
        </div>

        {/* Indicador de Margem */}
        <div
          className={`flex items-center justify-between p-4 rounded-lg ${
            isPositiveMargin
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-destructive/10 border border-destructive/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {isPositiveMargin ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
            <span className="font-medium">% Margem sobre Faturamento Líquido</span>
          </div>
          <span
            className={`text-2xl font-bold ${
              isPositiveMargin ? "text-green-500" : "text-destructive"
            }`}
          >
            {formatPercent(calculations.margemPercent)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t pt-6">
        {/* Cliente Info */}
        {state.selectedClientName && (
          <div className="w-full flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Cliente: <strong className="text-foreground">{state.selectedClientName}</strong></span>
          </div>
        )}
        
        {/* Observações */}
        <div className="w-full space-y-2">
          <label className="text-sm font-medium">Observações (opcional)</label>
          <Textarea
            placeholder="Adicione notas sobre esta simulação..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="w-full flex items-center justify-between gap-4">
          {onReset && (
            <Button variant="outline" onClick={onReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Nova Simulação
            </Button>
          )}
          <Button 
            onClick={() => {
              saveSimulation.mutate({
                state,
                clientId: state.selectedClientId,
                clientName: state.selectedClientName,
                  calculations: {
                    fatLiquido: calculations.fatLiquido,
                    custoVenda: calculations.custoVenda,
                    margemBruta: calculations.margemBruta,
                    margemPercent: calculations.margemPercent,
                    adjustedCommissionPercent: calculations.comissaoAjustadaPercent,
                    commissionAdjustmentFactor: calculations.adjustmentFactor,
                  },
                notes: notes || undefined,
              });
            }}
            disabled={saveSimulation.isPending}
            className="gap-2 ml-auto"
          >
            <Save className="h-4 w-4" />
            {saveSimulation.isPending ? "Gravando..." : "Gravar Simulação"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
