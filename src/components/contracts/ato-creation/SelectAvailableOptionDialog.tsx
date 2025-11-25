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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { useOptions } from "@/hooks/useOptions";
import { formatCurrency } from "@/lib/quotation-utils";
import { PendingATOItem } from "./ATOItemsList";

interface SelectAvailableOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yachtModelId: string;
  onAdd: (item: PendingATOItem) => void;
}

export function SelectAvailableOptionDialog({
  open,
  onOpenChange,
  yachtModelId,
  onAdd,
}: SelectAvailableOptionDialogProps) {
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const { data: options, isLoading } = useOptions();

  const filteredOptions = options?.filter(
    (opt) =>
      (opt.yacht_model_id === yachtModelId || !opt.yacht_model_id) &&
      (opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = () => {
    if (!selectedOption) return;

    onAdd({
      id: crypto.randomUUID(),
      type: "add_optional",
      item_id: selectedOption.id,
      item_name: selectedOption.name,
      notes: notes || undefined,
      quantity,
      estimated_price: selectedOption.base_price * quantity,
      estimated_days: selectedOption.delivery_days_impact || 0,
    });

    setSelectedOption(null);
    setSearchQuery("");
    setQuantity(1);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Opcional Disponível</DialogTitle>
          <DialogDescription>
            Selecione um opcional disponível para este modelo de iate
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredOptions?.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setSelectedOption(option)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedOption?.id === option.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{option.name}</h4>
                        <Badge variant="outline">{option.code}</Badge>
                      </div>
                      {option.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {option.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-primary">
                        {formatCurrency(option.base_price)}
                      </p>
                      {option.delivery_days_impact > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +{option.delivery_days_impact} dias
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {selectedOption && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Estimado</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-semibold text-primary">
                  {formatCurrency(selectedOption.base_price * quantity)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações (Opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre este item..."
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedOption}>
            Adicionar à ATO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
