import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, Ship, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Simulation } from "@/hooks/useSimulations";

interface SimulationDetailDialogProps {
  simulation: Simulation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (simulation: Simulation) => void;
}

export function SimulationDetailDialog({
  simulation,
  open,
  onOpenChange,
  onDuplicate,
}: SimulationDetailDialogProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatForeignCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getMarginColor = (percent: number) => {
    if (percent >= 25) return "text-green-600";
    if (percent >= 15) return "text-yellow-600";
    return "text-red-600";
  };

  const hasTradeIn = simulation.has_trade_in ?? false;
  const isExporting = simulation.is_exporting ?? false;

  // Calcular valor em moeda de exportação
  const exportCurrency = simulation.export_currency || "USD";
  const exchangeRate = exportCurrency === "USD" ? simulation.usd_rate : simulation.eur_rate;
  const valorExportacao = isExporting && exchangeRate > 0
    ? simulation.faturamento_bruto / exchangeRate
    : null;

  // Calcular comissão final
  const comissaoFinal = simulation.adjusted_commission_percent !== null
    ? simulation.adjusted_commission_percent
    : simulation.commission_percent * (1 + (simulation.commission_adjustment_factor || 0));
  
  // Base para cálculo da comissão (cash value se trade-in)
  const cashValue = hasTradeIn 
    ? simulation.faturamento_bruto - (simulation.trade_in_entry_value || 0)
    : simulation.faturamento_bruto;
  const comissaoValor = (comissaoFinal / 100) * cashValue;

  // CIF/FOB
  const modalidade = isExporting ? "CIF" : "FOB";

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-simulation-pdf", {
        body: { simulationId: simulation.id },
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        window.open(data.pdfUrl, "_blank");
        toast.success("PDF gerado com sucesso!");
      } else {
        throw new Error("URL do PDF não retornada");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF da simulação");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span className="font-mono">{simulation.simulation_number}</span>
            {hasTradeIn && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                <Ship className="h-3 w-3 mr-1" />
                Trade-In
              </Badge>
            )}
            <Badge variant={simulation.margem_percent >= 25 ? "default" : simulation.margem_percent >= 15 ? "secondary" : "destructive"}>
              {simulation.margem_percent.toFixed(1)}% margem
            </Badge>
            <Badge variant="outline" className={isExporting ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-muted"}>
              {modalidade}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Identificação */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Identificação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{simulation.client_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modelo</p>
                <p className="font-medium">{simulation.yacht_model_code} - {simulation.yacht_model_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendedor (Comissão Base)</p>
                <p className="font-medium">{simulation.commission_name} ({simulation.commission_percent}%)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium">
                  {format(new Date(simulation.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Valor de Venda */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Valor de Venda</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Faturamento Bruto (BRL)</p>
                <p className="font-medium text-lg">{formatCurrency(simulation.faturamento_bruto)}</p>
              </div>
              {isExporting && valorExportacao !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Valor em {exportCurrency}</p>
                  <p className="font-medium text-lg">{formatForeignCurrency(valorExportacao, exportCurrency)}</p>
                  <p className="text-xs text-muted-foreground">câmbio: {exchangeRate.toFixed(4)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Modalidade</p>
                <p className="font-medium">
                  {modalidade} {isExporting ? "(transporte incluído)" : "(transporte não incluído)"}
                </p>
              </div>
              {isExporting && simulation.export_country && (
                <div>
                  <p className="text-xs text-muted-foreground">País Destino</p>
                  <p className="font-medium">{simulation.export_country}</p>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Comissão Final */}
          <section className="bg-primary/5 rounded-lg p-4 border">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Comissão Final a Pagar</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Comissão Base</p>
                <p className="font-medium">{simulation.commission_percent.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ajuste MDC</p>
                {simulation.adjusted_commission_percent !== null ? (
                  <p className="font-medium text-amber-600">Manual (fixo)</p>
                ) : (
                  <p className={`font-medium ${(simulation.commission_adjustment_factor || 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {(simulation.commission_adjustment_factor || 0) >= 0 ? '+' : ''}
                    {((simulation.commission_adjustment_factor || 0) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Comissão Final</p>
                <p className="text-lg font-bold text-primary">{comissaoFinal.toFixed(2)}%</p>
                <p className="text-sm font-medium">{formatCurrency(comissaoValor)}</p>
                {hasTradeIn && (
                  <p className="text-xs text-amber-600">(sobre cash: {formatCurrency(cashValue)})</p>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Inputs */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Valores de Entrada</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Transporte</p>
                <p className="font-medium">{formatCurrency(simulation.transporte_cost || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customizações Est.</p>
                <p className="font-medium">{formatCurrency(simulation.customizacoes_estimadas || 0)}</p>
              </div>
            </div>
          </section>

          {/* Trade-In Section */}
          {hasTradeIn && (
            <>
              <Separator />
              <section className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  Trade-In de Barco Usado
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-amber-700">Barco</p>
                    <p className="font-medium text-amber-900">
                      {simulation.trade_in_brand} {simulation.trade_in_model}
                      {simulation.trade_in_year && ` (${simulation.trade_in_year})`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-amber-700">Valor Entrada</p>
                      <p className="font-medium text-amber-900">
                        {formatCurrency(simulation.trade_in_entry_value || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-700">Valor Real</p>
                      <p className="font-medium text-amber-900">
                        {formatCurrency(simulation.trade_in_real_value || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-amber-700">Depreciação</p>
                    <p className="font-medium text-destructive">
                      {formatCurrency(simulation.trade_in_depreciation || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700">Custo Op. (3%)</p>
                    <p className="font-medium text-destructive">
                      {formatCurrency(simulation.trade_in_operation_cost || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700">Comissão (5%)</p>
                    <p className="font-medium text-destructive">
                      {formatCurrency(simulation.trade_in_commission || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700">Impacto Total</p>
                    <p className="font-bold text-destructive">
                      {formatCurrency(simulation.trade_in_total_impact || 0)}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          <Separator />

          {/* Taxas Snapshot */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Taxas Aplicadas</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Imposto Venda</p>
                <p>{simulation.sales_tax_percent}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Garantia</p>
                <p>{simulation.warranty_percent}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Royalties</p>
                <p>{simulation.royalties_percent}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tax Importação</p>
                <p>{simulation.tax_import_percent}%</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Custos */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Custos do Modelo</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">MP Importada ({simulation.custo_mp_import_currency})</p>
                <p>{simulation.custo_mp_import_currency === "EUR" ? "€" : "$"} {simulation.custo_mp_import.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MP Nacional</p>
                <p>{formatCurrency(simulation.custo_mp_nacional)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mão de Obra</p>
                <p>{simulation.custo_mo_horas}h × {formatCurrency(simulation.custo_mo_valor_hora)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Câmbio</p>
                <p>EUR: {simulation.eur_rate.toFixed(2)} | USD: {simulation.usd_rate.toFixed(2)}</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Resultados */}
          <section className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Resultado</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Faturamento Líquido</p>
                <p className="font-medium">{formatCurrency(simulation.faturamento_liquido)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Custo da Venda</p>
                <p className="font-medium">{formatCurrency(simulation.custo_venda)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margem Bruta (MDC)</p>
                <p className="text-xl font-bold">{formatCurrency(simulation.margem_bruta)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Margem %</p>
                <p className={`text-xl font-bold ${getMarginColor(simulation.margem_percent)}`}>
                  {simulation.margem_percent.toFixed(1)}%
                </p>
              </div>
            </div>
          </section>

          {/* Notas */}
          {simulation.notes && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Observações</h3>
                <p className="text-sm whitespace-pre-wrap">{simulation.notes}</p>
              </section>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button variant="outline" onClick={handleExportPdf} disabled={isExportingPdf}>
            {isExportingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
          <Button onClick={() => onDuplicate(simulation)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar como Nova
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
