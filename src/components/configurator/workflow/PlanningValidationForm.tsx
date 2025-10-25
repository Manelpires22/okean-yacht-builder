import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdvanceCustomizationWorkflow, type CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { ArrowRight, Calendar } from "lucide-react";

interface PlanningValidationFormProps {
  customization: CustomizationWorkflow;
}

export function PlanningValidationForm({ customization }: PlanningValidationFormProps) {
  const [planningWindowStart, setPlanningWindowStart] = useState(
    customization.planning_window_start || ""
  );
  const [deliveryImpactDays, setDeliveryImpactDays] = useState(
    customization.planning_delivery_impact_days || 0
  );
  const [planningNotes, setPlanningNotes] = useState(customization.planning_notes || "");

  const { mutate: advance, isPending } = useAdvanceCustomizationWorkflow();

  const handleSubmit = () => {
    if (deliveryImpactDays < 0) {
      return;
    }

    advance({
      customizationId: customization.id,
      currentStep: 'planning_check',
      action: 'advance',
      data: {
        planning_window_start: planningWindowStart || null,
        planning_delivery_impact_days: deliveryImpactDays,
        planning_notes: planningNotes,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planejamento: Validação de Viabilidade</CardTitle>
        <CardDescription>
          Valide a viabilidade no atravessamento e impacto de prazo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="planning-window">Janela de Inserção (Opcional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="planning-window"
                type="date"
                value={planningWindowStart}
                onChange={(e) => setPlanningWindowStart(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Data estimada para iniciar a customização
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-impact">Impacto no Prazo (dias) *</Label>
            <Input
              id="delivery-impact"
              type="number"
              min="0"
              value={deliveryImpactDays}
              onChange={(e) => setDeliveryImpactDays(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Quantos dias serão adicionados ao prazo total
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="planning-notes">Observações do Planejamento</Label>
          <Textarea
            id="planning-notes"
            value={planningNotes}
            onChange={(e) => setPlanningNotes(e.target.value)}
            placeholder="Comentários sobre capacidade, conflitos, recursos necessários..."
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: Capacidade OK, necessário realocar equipe na semana 47, sem conflitos identificados.
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">Resumo de Inputs</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Custo Supply:</span>
              <span className="ml-2 font-medium">
                R$ {customization.supply_cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Lead Time Supply:</span>
              <span className="ml-2 font-medium">{customization.supply_lead_time_days} dias</span>
            </div>
            <div>
              <span className="text-muted-foreground">Horas Engenharia:</span>
              <span className="ml-2 font-medium">{customization.engineering_hours}h</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending || deliveryImpactDays < 0}
          className="w-full"
        >
          {isPending ? "Processando..." : (
            <>
              Devolver ao PM para Preço Final <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
