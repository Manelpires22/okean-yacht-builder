import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdvanceATOWorkflow, ATOWorkflow, ATOWorkflowStep } from "@/hooks/useATOWorkflow";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { Separator } from "@/components/ui/separator";

interface ATOPMFinalFormProps {
  atoWorkflow: ATOWorkflow;
  currentStep: ATOWorkflowStep;
}

export function ATOPMFinalForm({ atoWorkflow, currentStep }: ATOPMFinalFormProps) {
  const baseCost = atoWorkflow.price_impact || 0;
  const [finalPrice, setFinalPrice] = useState(baseCost);
  const [finalDeliveryImpact, setFinalDeliveryImpact] = useState(atoWorkflow.delivery_days_impact || 0);
  const [notes, setNotes] = useState("");

  const { mutate: advance, isPending } = useAdvanceATOWorkflow();

  // Sugestão automática com markup (se houver custo de supply)
  const suggestedPrice = useMemo(() => {
    if (baseCost > 0) {
      const MARKUP_DIVISOR = 0.43; // 1 - 30% - 21% - 3% - 3%
      return Math.round((baseCost / MARKUP_DIVISOR) * 100) / 100;
    }
    return 0;
  }, [baseCost]);

  const handleApprove = () => {
    if (finalPrice < 0 || finalDeliveryImpact < 0) {
      alert("Valores não podem ser negativos.");
      return;
    }

    advance({
      atoId: atoWorkflow.id,
      stepId: currentStep.id,
      stepType: 'pm_final',
      action: 'advance',
      data: {
        pm_final_price: finalPrice,
        pm_final_delivery_impact_days: finalDeliveryImpact,
        notes: notes,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PM Final: Aprovação Final</CardTitle>
        <CardDescription>
          Revise e confirme preço e prazo finais da ATO
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo dos Steps Anteriores */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">Resumo do Workflow</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Custo Supply:</span>
              <span className="ml-2 font-medium">{formatCurrency(baseCost)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Prazo Planning:</span>
              <span className="ml-2 font-medium">{atoWorkflow.delivery_days_impact || 0} dias</span>
            </div>
          </div>
          {suggestedPrice > 0 && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground">Preço Sugerido (com markup):</span>
                <span className="ml-2 font-bold text-primary">{formatCurrency(suggestedPrice)}</span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="final-price">Preço Final da ATO (R$) *</Label>
          <Input
            id="final-price"
            type="number"
            min="0"
            step="0.01"
            value={finalPrice || ""}
            onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
            placeholder="Ex: 25000.00"
          />
          {finalPrice > 0 && (
            <p className="text-sm text-muted-foreground">
              Valor: {formatCurrency(finalPrice)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="final-delivery">Impacto Final no Prazo (dias) *</Label>
          <Input
            id="final-delivery"
            type="number"
            min="0"
            value={finalDeliveryImpact}
            onChange={(e) => setFinalDeliveryImpact(parseInt(e.target.value) || 0)}
            placeholder="Ex: 20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas Finais (Opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Observações finais, alertas para o cliente..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleApprove}
          disabled={isPending || finalPrice < 0 || finalDeliveryImpact < 0}
          className="w-full"
        >
          {isPending ? "Processando..." : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar ATO e Consolidar no Contrato
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
