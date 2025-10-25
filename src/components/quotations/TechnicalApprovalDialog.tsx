import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";

interface TechnicalApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customization: {
    id: string;
    item_name: string;
    notes?: string;
    quantity?: number;
  };
  onApprove: (data: TechnicalApprovalData) => Promise<void>;
}

export interface TechnicalApprovalData {
  customizationId: string;
  status: 'approved' | 'rejected';
  engineeringNotes: string;
  additionalCost?: number;
  deliveryImpactDays?: number;
}

export function TechnicalApprovalDialog({
  open,
  onOpenChange,
  customization,
  onApprove
}: TechnicalApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
  const [engineeringNotes, setEngineeringNotes] = useState("");
  const [additionalCost, setAdditionalCost] = useState<string>("");
  const [deliveryImpactDays, setDeliveryImpactDays] = useState<string>("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onApprove({
        customizationId: customization.id,
        status,
        engineeringNotes,
        additionalCost: additionalCost ? parseFloat(additionalCost) : undefined,
        deliveryImpactDays: deliveryImpactDays ? parseInt(deliveryImpactDays) : undefined
      });
      onOpenChange(false);
      
      // Reset form
      setStatus('approved');
      setEngineeringNotes("");
      setAdditionalCost("");
      setDeliveryImpactDays("");
    } catch (error) {
      console.error("Erro ao aprovar customização:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Validação Técnica de Customização</DialogTitle>
          <DialogDescription>
            Analise a viabilidade técnica e impactos da customização solicitada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Customização */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium">{customization.item_name}</h4>
            {customization.notes && (
              <p className="text-sm text-muted-foreground">{customization.notes}</p>
            )}
            {customization.quantity && (
              <p className="text-sm">Quantidade: {customization.quantity}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label>Decisão Técnica *</Label>
            <RadioGroup value={status} onValueChange={(value: any) => setStatus(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="cursor-pointer flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Aprovar - Customização é viável
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="cursor-pointer flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Rejeitar - Customização não é viável
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notas da Engenharia */}
          <div className="space-y-2">
            <Label htmlFor="engineeringNotes">
              Parecer Técnico *
            </Label>
            <Textarea
              id="engineeringNotes"
              placeholder={
                status === 'approved'
                  ? "Descreva como a customização será implementada, materiais necessários, alterações no projeto..."
                  : "Explique os motivos técnicos da inviabilidade, sugira alternativas se possível..."
              }
              value={engineeringNotes}
              onChange={(e) => setEngineeringNotes(e.target.value)}
              rows={5}
              required
            />
          </div>

          {/* Campos adicionais se aprovado */}
          {status === 'approved' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="additionalCost">
                    Custo Adicional (R$)
                  </Label>
                  <Input
                    id="additionalCost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={additionalCost}
                    onChange={(e) => setAdditionalCost(e.target.value)}
                  />
                  {additionalCost && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(parseFloat(additionalCost))}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryImpactDays">
                    Impacto no Prazo (dias)
                  </Label>
                  <Input
                    id="deliveryImpactDays"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={deliveryImpactDays}
                    onChange={(e) => setDeliveryImpactDays(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !engineeringNotes.trim()}
            variant={status === 'approved' ? 'default' : 'destructive'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : status === 'approved' ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprovar Customização
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Rejeitar Customização
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
