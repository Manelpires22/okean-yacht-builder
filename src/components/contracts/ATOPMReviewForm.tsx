import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAdvanceATOWorkflow, ATOWorkflow, ATOWorkflowStep } from "@/hooks/useATOWorkflow";
import { CheckCircle2, XCircle } from "lucide-react";

interface ATOPMReviewFormProps {
  atoWorkflow: ATOWorkflow;
  currentStep: ATOWorkflowStep;
}

export function ATOPMReviewForm({ atoWorkflow, currentStep }: ATOPMReviewFormProps) {
  const [pmScope, setPmScope] = useState(atoWorkflow.notes || "");
  const [notes, setNotes] = useState("");

  const { mutate: advance, isPending } = useAdvanceATOWorkflow();

  const handleApprove = () => {
    if (!pmScope.trim()) {
      alert("Por favor, defina o escopo técnico.");
      return;
    }

    advance({
      atoId: atoWorkflow.id,
      stepId: currentStep.id,
      stepType: 'pm_review',
      action: 'advance',
      data: {
        pm_scope: pmScope,
        notes: notes,
      },
    });
  };

  const handleReject = () => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;

    advance({
      atoId: atoWorkflow.id,
      stepId: currentStep.id,
      stepType: 'pm_review',
      action: 'reject',
      data: {
        reject_reason: reason,
        notes: reason,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PM Review: Definir Escopo</CardTitle>
        <CardDescription>
          Analise a solicitação e defina o escopo técnico da ATO
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pm-scope">Escopo Técnico *</Label>
          <Textarea
            id="pm-scope"
            placeholder="Descreva o escopo técnico completo da ATO..."
            value={pmScope}
            onChange={(e) => setPmScope(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas Adicionais (Opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Observações, restrições, alertas..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleApprove}
            disabled={isPending || !pmScope.trim()}
            className="flex-1"
          >
            {isPending ? "Processando..." : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprovar e Avançar
              </>
            )}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isPending}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Rejeitar ATO
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
