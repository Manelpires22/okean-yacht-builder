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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Wrench } from "lucide-react";
import { useContractItems } from "@/hooks/useContractItems";
import { formatCurrency } from "@/lib/quotation-utils";
import { PendingATOItem } from "./ATOItemsList";

interface SelectContractItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onAdd: (item: PendingATOItem) => void;
}

export function SelectContractItemDialog({
  open,
  onOpenChange,
  contractId,
  onAdd,
}: SelectContractItemDialogProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemType, setItemType] = useState<"option" | "memorial">("option");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useContractItems(contractId);

  const handleAdd = () => {
    if (!selectedItem) return;

    onAdd({
      id: crypto.randomUUID(),
      type: "edit_existing",
      item_id: selectedItem.id,
      item_name: selectedItem.name || selectedItem.item_name,
      notes: notes || `Modificação solicitada`,
      estimated_price: selectedItem.base_price || selectedItem.unit_price || 0,
      estimated_days: selectedItem.delivery_days_impact || 0,
    });

    setSelectedItem(null);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Item Existente do Contrato</DialogTitle>
          <DialogDescription>
            Selecione um item do contrato base para modificar
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs
            value={itemType}
            onValueChange={(v) => {
              setItemType(v as any);
              setSelectedItem(null);
            }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="option" className="gap-2">
                <Package className="h-4 w-4" />
                Opcionais ({data?.options?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="memorial" className="gap-2">
                <Wrench className="h-4 w-4" />
                Memorial ({data?.memorialItems?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="option" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {data?.options?.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedItem(option)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedItem?.id === option.id
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
                            {formatCurrency(option.unit_price || option.base_price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="memorial" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {data?.memorialItems?.map((item: any) => (
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
                          <h4 className="font-semibold mb-1">{item.item_name}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {item.brand && (
                              <Badge variant="secondary" className="text-xs">
                                {item.brand}
                              </Badge>
                            )}
                            {item.model && (
                              <Badge variant="secondary" className="text-xs">
                                {item.model}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {selectedItem && (
          <div className="space-y-2 border-t pt-4">
            <Label>Descrição da Modificação *</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva qual modificação será feita neste item..."
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedItem || !notes.trim()}>
            Adicionar à ATO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
