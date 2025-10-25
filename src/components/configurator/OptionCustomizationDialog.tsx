import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface OptionCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionName: string;
  existingNotes?: string;
  onSave: (notes: string) => void;
}

export function OptionCustomizationDialog({
  open,
  onOpenChange,
  optionName,
  existingNotes,
  onSave,
}: OptionCustomizationDialogProps) {
  const [notes, setNotes] = useState(existingNotes || "");

  // Update notes when dialog opens with existing notes
  useEffect(() => {
    if (open) {
      setNotes(existingNotes || "");
    }
  }, [open, existingNotes]);

  const handleSave = () => {
    onSave(notes.trim());
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNotes(existingNotes || "");
    onOpenChange(false);
  };

  const handleRemoveCustomization = () => {
    onSave("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customizar Opcional</DialogTitle>
          <DialogDescription>
            Item: <span className="font-semibold">{optionName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Descreva as modificações ou adaptações desejadas para este opcional.
              A equipe técnica analisará a viabilidade e fornecerá orçamento adicional se necessário.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Descrição da Customização
            </Label>
            <Textarea
              id="notes"
              placeholder="Ex: Gostaria que o sistema de som incluísse subwoofers adicionais, ou mudar a cor do acabamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/1000 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingNotes && (
            <Button
              variant="destructive"
              onClick={handleRemoveCustomization}
              className="mr-auto"
            >
              Remover Customização
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}