import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdvanceATOWorkflow, ATOWorkflow, ATOWorkflowStep } from "@/hooks/useATOWorkflow";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";

interface ATOSupplyQuoteFormProps {
  atoWorkflow: ATOWorkflow;
  currentStep: ATOWorkflowStep;
}

export function ATOSupplyQuoteForm({ atoWorkflow, currentStep }: ATOSupplyQuoteFormProps) {
  const [supplyCost, setSupplyCost] = useState(0);
  const [supplyNotes, setSupplyNotes] = useState("");

  const { mutate: advance, isPending } = useAdvanceATOWorkflow();

  const handleApprove = () => {
    if (supplyCost <= 0) {
      alert("Por favor, informe o custo dos materiais.");
      return;
    }

    advance({
      atoId: atoWorkflow.id,
      stepId: currentStep.id,
      stepType: 'supply_quote',
      action: 'advance',
      data: {
        supply_cost: supplyCost,
        notes: supplyNotes,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply: Cotação de Materiais</CardTitle>
        <CardDescription>
          Informe o custo total dos materiais necessários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supply-cost">Custo Total de Materiais (R$) *</Label>
          <Input
            id="supply-cost"
            type="number"
            min="0"
            step="0.01"
            value={supplyCost || ""}
            onChange={(e) => setSupplyCost(parseFloat(e.target.value) || 0)}
            placeholder="Ex: 15000.00"
          />
          {supplyCost > 0 && (
            <p className="text-sm text-muted-foreground">
              Valor: {formatCurrency(supplyCost)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="supply-notes">Observações (Opcional)</Label>
          <Textarea
            id="supply-notes"
            placeholder="Fornecedores, prazo de entrega, detalhes dos materiais..."
            value={supplyNotes}
            onChange={(e) => setSupplyNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleApprove}
          disabled={isPending || supplyCost <= 0}
          className="w-full"
        >
          {isPending ? "Processando..." : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Cotação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
