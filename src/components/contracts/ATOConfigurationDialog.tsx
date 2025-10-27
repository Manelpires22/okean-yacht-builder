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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOptions } from "@/hooks/useOptions";
import { useMemorialItems } from "@/hooks/useMemorialItems";
import { useAddATOConfiguration } from "@/hooks/useATOConfigurations";
import { Loader2, Package, Wrench, Search } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";

interface ATOConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atoId: string;
  contractId: string;
}

export function ATOConfigurationDialog({
  open,
  onOpenChange,
  atoId,
  contractId,
}: ATOConfigurationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemType, setItemType] = useState<"option" | "memorial_item">("option");
  const [notes, setNotes] = useState("");

  const { data: options, isLoading: loadingOptions } = useOptions();
  const { data: memorialItems, isLoading: loadingMemorial } = useMemorialItems();
  const { mutate: addConfiguration, isPending } = useAddATOConfiguration();

  const handleAdd = () => {
    if (!selectedItem) return;

    addConfiguration(
      {
        ato_id: atoId,
        item_id: selectedItem.id,
        item_type: itemType,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setSelectedItem(null);
          setNotes("");
          onOpenChange(false);
        },
      }
    );
  };

  const filteredOptions = options?.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMemorialItems = memorialItems?.filter((item) =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Item à ATO</DialogTitle>
          <DialogDescription>
            Selecione um opcional ou item do memorial descritivo para vincular a esta ATO
          </DialogDescription>
        </DialogHeader>

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
              Opcionais
            </TabsTrigger>
            <TabsTrigger value="memorial_item" className="gap-2">
              <Wrench className="h-4 w-4" />
              Memorial Descritivo
            </TabsTrigger>
          </TabsList>

          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <TabsContent value="option" className="flex-1 overflow-hidden">
            {loadingOptions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredOptions?.map((option) => (
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
          </TabsContent>

          <TabsContent value="memorial_item" className="flex-1 overflow-hidden">
            {loadingMemorial ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredMemorialItems?.map((item) => (
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
                        {item.quantity && (
                          <div className="text-right ml-4">
                            <p className="text-sm text-muted-foreground">
                              Qtd: {item.quantity}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {selectedItem && (
          <div className="space-y-2 border-t pt-4">
            <Label>Observações (Opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre esta configuração..."
              rows={2}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedItem || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
