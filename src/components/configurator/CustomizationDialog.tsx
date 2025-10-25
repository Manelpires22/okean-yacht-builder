import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    if (!notes.trim()) {
      return;
    }

    onSave({
      notes: notes.trim(),
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
              Descreva as modificações desejadas. A equipe técnica analisará a
              viabilidade e fornecerá orçamento e prazo adicionais.
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
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/1000 caracteres
            </p>
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
          <Button onClick={handleSave} disabled={!notes.trim()}>
            Salvar Customização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
