import { useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Globe, Home, TrendingUp, TrendingDown, Save, RotateCcw, User, Ship, Percent } from "lucide-react";
import { SimulatorState, ExportCurrency } from "@/hooks/useSimulatorState";
import { CurrencyInput, NumericInput } from "@/components/ui/numeric-input";
import { useSaveSimulation } from "@/hooks/useSimulations";
import { cn } from "@/lib/utils";

// Formatar valor na moeda de exportação
function formatExportCurrency(value: number, currency: ExportCurrency): string {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Obter símbolo da moeda de exportação
function getExportCurrencyPrefix(currency: ExportCurrency): string {
  return currency === 'USD' ? '$ ' : '€ ';
}

// Converter BRL para moeda estrangeira
function brlToForeign(brlValue: number, currency: ExportCurrency, eurRate: number, usdRate: number): number {
  const rate = currency === 'USD' ? usdRate : eurRate;
  return rate > 0 ? brlValue / rate : brlValue;
}

// Converter moeda estrangeira para BRL
function foreignToBrl(foreignValue: number, currency: ExportCurrency, eurRate: number, usdRate: number): number {
  const rate = currency === 'USD' ? usdRate : eurRate;
  return foreignValue * rate;
}

interface MDCSimulationPanelProps {
  state: SimulatorState;
  onUpdateField: <K extends keyof SimulatorState>(field: K, value: SimulatorState[K]) => void;
  onReset?: () => void;
  onResetToOriginal?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
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
  disabled?: boolean;
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
  disabled,
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
        {isEditable && editableField && onUpdateField && !disabled ? (
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

// Presets de desconto (apenas negativos, de 5% em 5% até 25%)
const DISCOUNT_PRESETS = [0, -5, -10, -15, -20, -25];

interface DiscountControlProps {
  discountPercent: number;
  originalBasePrice: number;
  onDiscountChange: (percent: number) => void;
}

function DiscountControl({ discountPercent, originalBasePrice, onDiscountChange }: DiscountControlProps) {
  const finalPrice = originalBasePrice * (1 + discountPercent / 100);
  
  return (
    <div className="mt-2 mb-3 p-3 rounded-lg bg-muted/50 border border-border space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Percent className="h-3 w-3" />
        <span className="font-medium">Ajuste de Preço</span>
      </div>
      
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {DISCOUNT_PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={Math.abs(discountPercent - preset) < 0.1 ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-7 px-2 text-xs font-medium",
              preset < 0 && "text-destructive hover:text-destructive",
              Math.abs(discountPercent - preset) < 0.1 && preset < 0 && "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground",
              Math.abs(discountPercent - preset) < 0.1 && preset === 0 && "bg-primary text-primary-foreground"
            )}
            onClick={() => onDiscountChange(preset)}
          >
            {preset === 0 ? "0%" : `${preset}%`}
          </Button>
        ))}
      </div>
      
      {/* Slider */}
      <div className="space-y-2">
        <Slider
          value={[discountPercent]}
          onValueChange={([value]) => onDiscountChange(value)}
          min={-40}
          max={0}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-40%</span>
          <span className={cn(
            "font-semibold text-sm",
            discountPercent < 0 ? "text-destructive" : "text-foreground"
          )}>
            {discountPercent.toFixed(1)}%
          </span>
          <span>0%</span>
        </div>
      </div>
      
      {/* Price comparison */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <span className="text-muted-foreground">Tabela:</span>
        <span className="font-mono font-medium">{formatCurrency(originalBasePrice)}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-muted-foreground">Final:</span>
        <span className={cn(
          "font-mono font-medium",
          discountPercent < 0 && "text-destructive"
        )}>
          {formatCurrency(finalPrice)}
        </span>
      </div>
    </div>
  );
}

export function MDCSimulationPanel({
  state,
  onUpdateField,
  onReset,
  onResetToOriginal,
}: MDCSimulationPanelProps) {
  const [notes, setNotes] = useState("");
  const saveSimulation = useSaveSimulation();
  
  // Câmbio para conversão
  const exchangeRate =
    state.custoMpImportCurrency === "EUR" ? state.eurRate : state.usdRate;

  // MDC ideal fixa em 30%
  const MDC_IDEAL = 30;

  // Trade-In rules from state (editable per simulation)
  const TRADE_IN_OPERATION_COST_PERCENT = state.tradeInOperationCostPercent;
  const TRADE_IN_COMMISSION_PERCENT = state.tradeInCommissionPercent;
  const TRADE_IN_COMMISSION_REDUCTION = state.tradeInCommissionReduction;

  // Cálculos de FATURAMENTO com comissão variável e trade-in
  const calculations = useMemo(() => {
    const fatBruto = state.faturamentoBruto;
    // Usar comissão ajustada se definida, senão a original selecionada
    const comissaoBase = state.adjustedCommissionPercent ?? state.selectedCommissionPercent;

    // Desconto sobre o valor original de tabela
    const discountFromOriginal = state.originalBasePrice > 0 
      ? ((fatBruto - state.originalBasePrice) / state.originalBasePrice) * 100 
      : 0;

    // Trade-In calculations
    const tradeInDepreciation = state.hasTradeIn 
      ? state.tradeInEntryValue - state.tradeInRealValue 
      : 0;
    const tradeInOperationCost = state.hasTradeIn 
      ? state.tradeInRealValue * (TRADE_IN_OPERATION_COST_PERCENT / 100)
      : 0;
    const tradeInCommission = state.hasTradeIn 
      ? state.tradeInRealValue * (TRADE_IN_COMMISSION_PERCENT / 100)
      : 0;
    const tradeInTotalImpact = tradeInDepreciation + tradeInOperationCost + tradeInCommission;

    // Base de cálculo da comissão = apenas cash (Fat. Bruto - Entrada do Trade-In)
    const cashValue = state.hasTradeIn 
      ? fatBruto - state.tradeInEntryValue 
      : fatBruto;

    // Comissão ajustada: redução de 0.5% quando há trade-in
    const comissaoBaseAjustadaTradeIn = state.hasTradeIn 
      ? Math.max(0, comissaoBase - TRADE_IN_COMMISSION_REDUCTION)
      : comissaoBase;

    // Deduções sobre faturamento (com comissão BASE para calcular MDC referência)
    const taxValue = fatBruto * (state.salesTaxPercent / 100);
    const comissaoBaseValue = cashValue * (comissaoBaseAjustadaTradeIn / 100);
    const royaltiesValue = fatBruto * (state.royaltiesPercent / 100);
    const transporteValue = state.isExporting ? state.transporteCost : 0;

    // Faturamento Líquido (com comissão base ajustada)
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
    const margemBrutaRef = fatLiquidoBase - custoVenda - garantiaValue - tradeInTotalImpact;
    const margemPercentRef = fatLiquidoBase > 0 ? (margemBrutaRef / fatLiquidoBase) * 100 : 0;

    // Calcular fator de ajuste: (MDC Real - 30%) / 30%
    const adjustmentFactor = (margemPercentRef - MDC_IDEAL) / MDC_IDEAL;

    // Comissão ajustada = Comissão Base (já com redução trade-in) × (1 + Fator)
    const comissaoAjustadaPercent = comissaoBaseAjustadaTradeIn * (1 + adjustmentFactor);
    const comissaoAjustadaValue = cashValue * (comissaoAjustadaPercent / 100);

    // RECALCULAR Fat. Líquido com comissão ajustada
    const fatLiquido =
      fatBruto - taxValue - transporteValue - comissaoAjustadaValue - royaltiesValue;

    // MDC ANTES do impacto trade-in (sempre calculada)
    const margemBrutaAntes = fatLiquido - custoVenda - garantiaValue;
    const margemPercentAntes = fatLiquido > 0 ? (margemBrutaAntes / fatLiquido) * 100 : 0;

    // MDC APÓS impacto trade-in (só relevante quando há trade-in)
    const margemBrutaApos = margemBrutaAntes - tradeInTotalImpact;
    const margemPercentApos = fatLiquido > 0 ? (margemBrutaApos / fatLiquido) * 100 : 0;

    // Para compatibilidade: margemBruta é o valor final (com trade-in se houver)
    const margemBruta = state.hasTradeIn ? margemBrutaApos : margemBrutaAntes;
    const margemPercent = state.hasTradeIn ? margemPercentApos : margemPercentAntes;

    return {
      fatBruto,
      discountFromOriginal,
      originalBasePrice: state.originalBasePrice,
      cashValue,
      taxValue,
      transporteValue,
      comissaoBase,
      comissaoBaseAjustadaTradeIn,
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
      // Trade-In
      tradeInDepreciation,
      tradeInOperationCost,
      tradeInCommission,
      tradeInTotalImpact,
      // Results - ANTES e APÓS trade-in
      margemBrutaAntes,
      margemPercentAntes,
      margemBrutaApos,
      margemPercentApos,
      // Valores finais (para compatibilidade)
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
            {state.hasTradeIn && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-300">
                <Ship className="h-3 w-3" />
                Trade-In
              </Badge>
            )}
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
            <Badge 
              variant="outline"
              className={state.adjustedCommissionPercent !== null ? "border-amber-500 text-amber-700" : ""}
            >
              {state.selectedCommissionName} ({formatPercent(state.adjustedCommissionPercent ?? state.selectedCommissionPercent)}
              {state.adjustedCommissionPercent !== null && " *"})
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
            {/* FAT. BRUTO - Em moeda estrangeira para exportação */}
            {state.isExporting && state.exportCurrency ? (
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    FAT. BRUTO ({state.exportCurrency})
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    Taxa: 1 {state.exportCurrency} = {formatCurrency(state.exportCurrency === 'USD' ? state.usdRate : state.eurRate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <NumericInput
                    value={String(Math.round(brlToForeign(state.faturamentoBruto, state.exportCurrency, state.eurRate, state.usdRate)))}
                    onChange={(v) => {
                      const foreignValue = parseFloat(v) || 0;
                      const brlValue = foreignToBrl(foreignValue, state.exportCurrency!, state.eurRate, state.usdRate);
                      onUpdateField('faturamentoBruto', brlValue);
                      // Recalcular desconto
                      if (state.originalBasePrice > 0) {
                        const newDiscount = (brlValue - state.originalBasePrice) / state.originalBasePrice * 100;
                        onUpdateField('discountPercent', newDiscount);
                      }
                    }}
                    prefix={getExportCurrencyPrefix(state.exportCurrency)}
                    decimals={0}
                    className="w-48 text-right font-mono bg-primary/5 border-primary/20"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    ≈ {formatCurrency(state.faturamentoBruto)}
                  </span>
                </div>
              </div>
            ) : (
              <SimulationLine
                label="FAT. BRUTO"
                value={calculations.fatBruto}
                isEditable
                editableField="faturamentoBruto"
                onUpdateField={(field, value) => {
                  onUpdateField(field, value);
                  // Recalcular discountPercent quando editar manualmente
                  if (field === 'faturamentoBruto' && state.originalBasePrice > 0) {
                    const newDiscount = ((value as number) - state.originalBasePrice) / state.originalBasePrice * 100;
                    onUpdateField('discountPercent', newDiscount);
                  }
                }}
              />
            )}
            
            {/* Controle de Desconto Dinâmico */}
            {state.originalBasePrice > 0 && (
              <DiscountControl
                discountPercent={state.discountPercent}
                originalBasePrice={state.originalBasePrice}
                onDiscountChange={(percent) => {
                  const newFatBruto = state.originalBasePrice * (1 + percent / 100);
                  onUpdateField('discountPercent', percent);
                  onUpdateField('faturamentoBruto', newFatBruto);
                }}
              />
            )}
            
            {state.hasTradeIn && (
              <div className="flex items-center gap-2 text-xs pl-1 mb-1 text-amber-700">
                <Ship className="h-3 w-3" />
                <span>Cash: {formatCurrency(calculations.cashValue)} (Fat. Bruto - Trade-In)</span>
              </div>
            )}
            <SimulationLine
              label="TAX"
              value={calculations.taxValue}
              percent={state.salesTaxPercent}
              isNegative
            />
            <SimulationLine
              label="TRANSPORTE"
              value={calculations.transporteValue}
              isEditable={state.isExporting}
              disabled={!state.isExporting}
              editableField="transporteCost"
              onUpdateField={onUpdateField}
              isNegative
              detail={!state.isExporting ? "Apenas para exportação" : undefined}
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
                  base: {formatPercent(calculations.comissaoBaseAjustadaTradeIn)}
                  {state.hasTradeIn && <span className="text-amber-700"> (-0.5% trade-in)</span>}
                  , ajuste: {calculations.adjustmentFactor >= 0 ? '+' : ''}{formatPercent(calculations.adjustmentFactor * 100)}
                  {state.hasTradeIn && <span className="text-amber-700">, sobre cash</span>}
                </span>
              </div>
              <span className="font-mono text-sm text-destructive">
                - {formatCurrency(calculations.comissaoAjustadaValue)}
              </span>
            </div>
            
            {/* COMISSÃO BASE - Editável */}
            <div className="flex items-center justify-between py-2 bg-muted/30 px-2 rounded -mx-2">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  COMISSÃO BASE
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {state.selectedCommissionName} (original: {formatPercent(state.selectedCommissionPercent)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <NumericInput
                  value={String((state.adjustedCommissionPercent ?? state.selectedCommissionPercent) * 100)}
                  onChange={(v) => {
                    const newPercent = (parseFloat(v) || 0) / 100;
                    onUpdateField('adjustedCommissionPercent', newPercent);
                  }}
                  suffix=" %"
                  decimals={2}
                  className="w-24 text-right font-mono bg-primary/5 border-primary/20"
                />
                {state.adjustedCommissionPercent !== null && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateField('adjustedCommissionPercent', null)}
                    title="Restaurar valor original"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
              label="CUSTO IMPORT"
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

            {/* MDC ANTES do impacto trade-in */}
            <div className="mt-10 flex items-center justify-between bg-muted/50 -mx-4 px-4 py-3 rounded">
              <span className="font-bold text-lg text-foreground">MARGEM BRUTA (MDC)</span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-lg text-primary">
                  {formatCurrency(calculations.margemBrutaAntes)}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {formatPercent(calculations.margemPercentAntes)}
                </span>
              </div>
            </div>

            {/* Trade-In Impact Section - APÓS MDC */}
            {state.hasTradeIn && (
              <div className="mt-10 p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="h-4 w-4 text-amber-700" />
                  <span className="text-sm font-semibold text-amber-800">
                    Impacto Usado: {state.tradeInBrand} {state.tradeInModel} {state.tradeInYear && `(${state.tradeInYear})`}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  {/* Valores de entrada e real - ANTES da depreciação */}
                  <div className="flex justify-between">
                    <span className="text-amber-700">Valor de Entrada (Trade-In)</span>
                    <span className="font-mono">{formatCurrency(state.tradeInEntryValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Valor Real Projetado</span>
                    <span className="font-mono text-muted-foreground">{formatCurrency(state.tradeInRealValue)}</span>
                  </div>
                  <Separator className="my-2 bg-amber-300" />
                  {/* Cálculos */}
                  <div className="flex justify-between">
                    <span className="text-amber-700">Depreciação (Entrada - Real)</span>
                    <span className={`font-mono ${calculations.tradeInDepreciation > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {calculations.tradeInDepreciation > 0 ? '- ' : '+ '}
                      {formatCurrency(Math.abs(calculations.tradeInDepreciation))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Custo Operação ({TRADE_IN_OPERATION_COST_PERCENT}%)</span>
                    <span className="font-mono text-destructive">- {formatCurrency(calculations.tradeInOperationCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Comissão Usado ({TRADE_IN_COMMISSION_PERCENT}%)</span>
                    <span className="font-mono text-destructive">- {formatCurrency(calculations.tradeInCommission)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-300">
                    <span className="font-semibold text-amber-800">IMPACTO TOTAL USADO</span>
                    <span className="font-mono font-bold text-destructive">- {formatCurrency(calculations.tradeInTotalImpact)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* MDC APÓS impacto trade-in - só aparece quando tem trade-in */}
            {state.hasTradeIn && (
              <div className="mt-10 flex items-center justify-between bg-green-50 border border-green-200 -mx-4 px-4 py-3 rounded">
                <span className="font-bold text-lg text-green-800">MDC APÓS IMPACTO USADO</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg text-green-700">
                    {formatCurrency(calculations.margemBrutaApos)}
                  </span>
                  <span className="text-sm text-green-600 font-medium">
                    {formatPercent(calculations.margemPercentApos)}
                  </span>
                </div>
              </div>
            )}
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
          <div className="flex gap-2">
            {onReset && (
              <Button variant="outline" onClick={onReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Nova Simulação
              </Button>
            )}
            {onResetToOriginal && (
              <Button variant="ghost" onClick={onResetToOriginal} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Resetar Valores
              </Button>
            )}
          </div>
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
                  // Trade-In calculations
                  tradeInDepreciation: calculations.tradeInDepreciation,
                  tradeInOperationCost: calculations.tradeInOperationCost,
                  tradeInCommission: calculations.tradeInCommission,
                  tradeInTotalImpact: calculations.tradeInTotalImpact,
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
