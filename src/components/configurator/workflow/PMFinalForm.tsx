import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAdvanceCustomizationWorkflow, useWorkflowConfig, type CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { CheckCircle2, AlertCircle, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface PMFinalFormProps {
  customization: CustomizationWorkflow;
}

export function PMFinalForm({ customization }: PMFinalFormProps) {
  const [finalPrice, setFinalPrice] = useState(customization.pm_final_price || 0);
  const [finalDeliveryImpact, setFinalDeliveryImpact] = useState(
    customization.pm_final_delivery_impact_days || customization.planning_delivery_impact_days || 0
  );
  const [finalNotes, setFinalNotes] = useState(customization.pm_final_notes || "");

  const { data: config } = useWorkflowConfig();
  const { mutate: advance, isPending } = useAdvanceCustomizationWorkflow();

  const engineeringCost = (customization.engineering_hours || 0) * (config?.engineeringRate || 150);
  const technicalCost = (customization.supply_cost || 0) + engineeringCost;
  const contingencyPercent = (config?.contingencyPercent || 10) / 100;
  const costWithContingency = technicalCost * (1 + contingencyPercent);
  const suggestedPrice = Math.ceil(costWithContingency / 1000) * 1000; // Arredondar para cima em milhares

  const handleApprove = () => {
    if (finalPrice <= 0) {
      return;
    }

    advance({
      customizationId: customization.id,
      currentStep: 'pm_final',
      action: 'advance',
      data: {
        pm_final_price: finalPrice,
        pm_final_delivery_impact_days: finalDeliveryImpact,
        pm_final_notes: finalNotes,
      },
    });
  };

  const handleReject = () => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;

    advance({
      customizationId: customization.id,
      currentStep: 'pm_final',
      action: 'reject',
      data: {
        reject_reason: reason,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PM Final: Fechar Preço e Prazo</CardTitle>
        <CardDescription>
          Feche preço e prazo finais ao cliente. Avançar aprova a customização.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Ao aprovar esta customização, uma aprovação comercial pode ser criada automaticamente 
            se o valor total ultrapassar os limites configurados.
          </AlertDescription>
        </Alert>

        <div className="bg-muted p-4 rounded-lg space-y-3">
          <h4 className="font-semibold">Cálculo de Custo Técnico</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo Peças (Supply):</span>
              <span className="font-medium">{formatCurrency(customization.supply_cost || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Engenharia ({customization.engineering_hours}h × R$ {config?.engineeringRate || 150}/h):
              </span>
              <span className="font-medium">{formatCurrency(engineeringCost)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">Custo Técnico:</span>
              <span className="font-medium">{formatCurrency(technicalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                + Contingência ({config?.contingencyPercent || 10}%):
              </span>
              <span className="font-medium">{formatCurrency(costWithContingency)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Preço Sugerido (arredondado):</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(suggestedPrice)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="final-price">Preço de Venda ao Cliente (R$) *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="final-price"
              type="number"
              min="0"
              step="1000"
              value={finalPrice}
              onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFinalPrice(suggestedPrice)}
          >
            Usar preço sugerido
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="final-delivery-impact">Impacto Total no Prazo (dias) *</Label>
          <Input
            id="final-delivery-impact"
            type="number"
            min="0"
            value={finalDeliveryImpact}
            onChange={(e) => setFinalDeliveryImpact(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Planejamento sugeriu: {customization.planning_delivery_impact_days} dias
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="final-notes">Notas ao Vendedor/Cliente (Opcional)</Label>
          <Textarea
            id="final-notes"
            value={finalNotes}
            onChange={(e) => setFinalNotes(e.target.value)}
            placeholder="Informações importantes para o vendedor ou cliente..."
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleApprove}
            disabled={isPending || finalPrice <= 0}
            className="flex-1"
          >
            {isPending ? "Processando..." : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprovar Customização
              </>
            )}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isPending}
            variant="destructive"
            className="flex-1"
          >
            Rejeitar Customização
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
