import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Simulation } from "@/hooks/useSimulations";

interface SimulationDetailDialogProps {
  simulation: Simulation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimulationDetailDialog({
  simulation,
  open,
  onOpenChange,
}: SimulationDetailDialogProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getMarginColor = (percent: number) => {
    if (percent >= 25) return "text-green-600";
    if (percent >= 15) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono">{simulation.simulation_number}</span>
            <Badge variant={simulation.margem_percent >= 25 ? "default" : simulation.margem_percent >= 15 ? "secondary" : "destructive"}>
              {simulation.margem_percent.toFixed(1)}% margem
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
                <p className="text-xs text-muted-foreground">Vendedor</p>
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

          {/* Inputs */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Valores de Entrada</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Faturamento Bruto</p>
                <p className="font-medium">{formatCurrency(simulation.faturamento_bruto)}</p>
              </div>
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

          {/* Exportação */}
          {simulation.is_exporting && (
            <>
              <Separator />
              <section>
                <Badge variant="outline">Exportação: {simulation.export_country}</Badge>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
