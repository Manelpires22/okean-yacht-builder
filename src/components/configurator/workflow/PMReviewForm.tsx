import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAdvanceCustomizationWorkflow, type CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface PMReviewFormProps {
  customization: CustomizationWorkflow;
}

export function PMReviewForm({ customization }: PMReviewFormProps) {
  const [pmScope, setPmScope] = useState(customization.pm_scope || "");
  const [finalPrice, setFinalPrice] = useState(customization.pm_final_price || 0);
  const [deliveryImpact, setDeliveryImpact] = useState(customization.pm_final_delivery_impact_days || 0);
  const [requiredParts, setRequiredParts] = useState<string[]>(customization.required_parts || []);
  const [newPart, setNewPart] = useState("");
  const [notes, setNotes] = useState(customization.pm_final_notes || "");

  const { mutate: advance, isPending } = useAdvanceCustomizationWorkflow();

  const handleAddPart = () => {
    if (newPart.trim()) {
      setRequiredParts([...requiredParts, newPart.trim()]);
      setNewPart("");
    }
  };

  const handleRemovePart = (index: number) => {
    setRequiredParts(requiredParts.filter((_, i) => i !== index));
  };

  const handleApprove = () => {
    if (!pmScope || finalPrice <= 0 || deliveryImpact < 0) {
      return;
    }

    advance({
      customizationId: customization.id,
      currentStep: 'pm_review',
      action: 'advance',
      data: {
        pm_scope: pmScope,
        pm_final_price: finalPrice,
        pm_final_delivery_impact_days: deliveryImpact,
        required_parts: requiredParts,
        pm_final_notes: notes,
      },
    });
  };

  const handleReject = () => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;

    advance({
      customizationId: customization.id,
      currentStep: 'pm_review',
      action: 'reject',
      data: {
        reject_reason: reason,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise PM: Avaliação Completa</CardTitle>
        <CardDescription>
          Analise a viabilidade técnica, defina preço e prazo de entrega ao cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Ao aprovar, uma aprovação comercial pode ser criada automaticamente se o valor ultrapassar os limites configurados.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="pm-scope">Escopo Técnico *</Label>
          <Textarea
            id="pm-scope"
            placeholder="Descreva o escopo técnico completo da customização..."
            value={pmScope}
            onChange={(e) => setPmScope(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: Integração elétrica, reforço estrutural, instalação de novos sistemas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="final-price">Preço de Venda (R$) *</Label>
            <Input
              id="final-price"
              type="number"
              min="0"
              step="1000"
              value={finalPrice}
              onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Valor final ao cliente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-impact">Impacto no Prazo (dias) *</Label>
            <Input
              id="delivery-impact"
              type="number"
              min="0"
              value={deliveryImpact}
              onChange={(e) => setDeliveryImpact(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Dias adicionais ao prazo base
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Peças/Componentes Necessários</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da peça/componente"
              value={newPart}
              onChange={(e) => setNewPart(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPart())}
            />
            <Button type="button" onClick={handleAddPart} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {requiredParts.length > 0 && (
            <div className="space-y-1 mt-2">
              {requiredParts.map((part, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{part}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePart(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas ao Vendedor/Cliente (Opcional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informações importantes, observações, restrições..."
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleApprove}
            disabled={isPending || !pmScope || finalPrice <= 0 || deliveryImpact < 0}
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
