import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MIN_CUSTOMIZATION_CHARS = 50;

interface CustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  defaultQuantity?: number;
  existingCustomization?: {
    notes: string;
    quantity?: number;
  };
  onSave: (data: { notes: string; quantity?: number }) => void;
}

export function CustomizationDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  defaultQuantity,
  existingCustomization,
  onSave,
}: CustomizationDialogProps) {
  const [notes, setNotes] = useState(existingCustomization?.notes || "");
  const [quantity, setQuantity] = useState<number | undefined>(
    existingCustomization?.quantity || defaultQuantity
  );

  const handleSave = () => {
    const trimmedNotes = notes.trim();
    
    if (!trimmedNotes) {
      toast.error("A descrição não pode estar vazia");
      return;
    }

    if (trimmedNotes.length < MIN_CUSTOMIZATION_CHARS) {
      toast.error(`A descrição deve ter no mínimo ${MIN_CUSTOMIZATION_CHARS} caracteres para análise do PM`);
      return;
    }

    onSave({
      notes: trimmedNotes,
      quantity: quantity && quantity > 0 ? quantity : undefined,
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
    setNotes(existingCustomization?.notes || "");
    setQuantity(existingCustomization?.quantity || defaultQuantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Customização</DialogTitle>
          <DialogDescription>
            Item: <span className="font-semibold">{itemName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Descreva as modificações desejadas. <strong>Esta customização será enviada para validação técnica</strong> antes de ser incluída na cotação final. A equipe fornecerá orçamento e prazo adicionais.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Descrição da Customização <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Ex: Gostaria de mudar a cor do estofamento para azul marinho, ou adicionar um frigobar adicional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs">
              <div className={notes.trim().length < MIN_CUSTOMIZATION_CHARS ? "text-destructive flex items-center gap-1" : "text-muted-foreground"}>
                {notes.trim().length < MIN_CUSTOMIZATION_CHARS && (
                  <AlertCircle className="h-3 w-3" />
                )}
                Mínimo: {MIN_CUSTOMIZATION_CHARS} caracteres
              </div>
              <span className="text-muted-foreground">
                {notes.length}/1000 caracteres
              </span>
            </div>
          </div>

          {defaultQuantity && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade (opcional)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity || ""}
                onChange={(e) =>
                  setQuantity(e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder={`Padrão: ${defaultQuantity}`}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!notes.trim() || notes.trim().length < MIN_CUSTOMIZATION_CHARS}
          >
            Salvar Customização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
