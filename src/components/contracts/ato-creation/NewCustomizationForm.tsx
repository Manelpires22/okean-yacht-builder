import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PendingATOItem } from "./ATOItemsList";

interface NewCustomizationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: PendingATOItem) => void;
}

export function NewCustomizationForm({
  open,
  onOpenChange,
  onAdd,
}: NewCustomizationFormProps) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (!itemName.trim() || !description.trim()) return;
    if (description.length < 50) return;

    onAdd({
      id: crypto.randomUUID(),
      type: "new_customization",
      item_name: itemName,
      notes: description,
      quantity,
      estimated_price: 0, // PM vai definir
      estimated_days: 0,
    });

    setItemName("");
    setDescription("");
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Customização</DialogTitle>
          <DialogDescription>
            Solicite uma customização livre não prevista em catálogo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Customização *</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Ex: Estofamento customizado para salão"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição Detalhada * (mínimo 50 caracteres)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva em detalhes a customização solicitada, incluindo especificações técnicas, materiais, cores, etc..."
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/2000 caracteres {description.length < 50 && `(mínimo 50)`}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Nota:</strong> Esta customização será enviada para o PM de Engenharia
              avaliar viabilidade técnica, custos e prazos antes de ser aprovada.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!itemName.trim() || description.length < 50}
          >
            Adicionar à ATO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
