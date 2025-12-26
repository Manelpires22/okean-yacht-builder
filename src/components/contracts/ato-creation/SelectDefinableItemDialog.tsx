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
import { Loader2, Search, AlertCircle, FileText } from "lucide-react";
import { useMemorialItems } from "@/hooks/useMemorialItems";
import { useItemUsageCheck } from "@/hooks/useItemUsageCheck";
import { PendingATOItem } from "./ATOItemsList";

interface SelectDefinableItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yachtModelId: string;
  contractId?: string;
  onAdd: (item: PendingATOItem) => void;
}

export function SelectDefinableItemDialog({
  open,
  onOpenChange,
  yachtModelId,
  contractId,
  onAdd,
}: SelectDefinableItemDialogProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [definition, setDefinition] = useState("");

  const { data: memorialItems, isLoading } = useMemorialItems(yachtModelId);
  const { getMemorialItemStatus } = useItemUsageCheck(contractId);

  // Filtrar apenas itens configuráveis (A Definir)
  const definableItems = memorialItems?.filter(
    (item) =>
      item.is_configurable &&
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (!selectedItem || !definition.trim()) return;

    onAdd({
      id: crypto.randomUUID(),
      type: "define_finishing",
      item_id: selectedItem.id,
      item_name: selectedItem.item_name,
      notes: definition,
      estimated_price: 0,
      estimated_days: 0,
    });

    setSelectedItem(null);
    setSearchQuery("");
    setDefinition("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Definir Item de Decor/Acabamento</DialogTitle>
          <DialogDescription>
            Selecione um item marcado como "A Definir" e especifique as opções escolhidas
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens a definir..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : definableItems && definableItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p>Nenhum item "A Definir" encontrado para este modelo</p>
            <p className="text-sm mt-1">
              Todos os itens de acabamento já foram especificados
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {definableItems?.map((item) => {
                const usageStatus = getMemorialItemStatus(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedItem?.id === item.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold">{item.item_name}</h4>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            A Definir
                          </Badge>
                          {usageStatus?.inATOs.map((atoLabel) => (
                            <Badge 
                              key={atoLabel} 
                              variant="outline" 
                              className="text-xs gap-1 border-amber-500 text-amber-600"
                            >
                              <FileText className="h-3 w-3" />
                              Definido em {atoLabel}
                            </Badge>
                          ))}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {item.brand && (
                            <Badge variant="secondary" className="text-xs">
                              {item.brand}
                            </Badge>
                          )}
                          {item.quantity && (
                            <Badge variant="secondary" className="text-xs">
                              Qtd: {item.quantity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {selectedItem && (
          <div className="space-y-2 border-t pt-4">
            <Label>Especificação Escolhida *</Label>
            <Textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Descreva a especificação escolhida (cor, material, marca, modelo, etc)..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Seja o mais específico possível para evitar retrabalho
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedItem || !definition.trim()}>
            Adicionar à ATO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
