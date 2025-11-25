import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdvanceATOWorkflow, ATOWorkflow, ATOWorkflowStep } from "@/hooks/useATOWorkflow";
import { CheckCircle2 } from "lucide-react";

interface ATOPlanningValidationFormProps {
  atoWorkflow: ATOWorkflow;
  currentStep: ATOWorkflowStep;
}

export function ATOPlanningValidationForm({ atoWorkflow, currentStep }: ATOPlanningValidationFormProps) {
  const [deliveryImpact, setDeliveryImpact] = useState(0);
  const [planningNotes, setPlanningNotes] = useState("");

  const { mutate: advance, isPending } = useAdvanceATOWorkflow();

  const handleApprove = () => {
    if (deliveryImpact < 0) {
      alert("O impacto no prazo não pode ser negativo.");
      return;
    }

    advance({
      atoId: atoWorkflow.id,
      stepId: currentStep.id,
      stepType: 'planning_validation',
      action: 'advance',
      data: {
        planning_delivery_impact_days: deliveryImpact,
        notes: planningNotes,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning: Validação de Prazo</CardTitle>
        <CardDescription>
          Defina o impacto desta ATO no prazo de entrega
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delivery-impact">Impacto no Prazo (dias) *</Label>
          <Input
            id="delivery-impact"
            type="number"
            min="0"
            value={deliveryImpact}
            onChange={(e) => setDeliveryImpact(parseInt(e.target.value) || 0)}
            placeholder="Ex: 15"
          />
          <p className="text-sm text-muted-foreground">
            Dias adicionais ao prazo base do contrato
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="planning-notes">Observações (Opcional)</Label>
          <Textarea
            id="planning-notes"
            placeholder="Justificativa do prazo, dependências, restrições..."
            value={planningNotes}
            onChange={(e) => setPlanningNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleApprove}
          disabled={isPending || deliveryImpact < 0}
          className="w-full"
        >
          {isPending ? "Processando..." : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Prazo
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
