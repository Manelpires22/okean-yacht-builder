import { useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, Wrench, Search, ArrowUpCircle, FileEdit } from "lucide-react";
import { useContractItems } from "@/hooks/useContractItems";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/quotation-utils";
import { PendingATOItem } from "./ATOItemsList";

interface SelectContractItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onAdd: (item: PendingATOItem) => void;
}

type ItemType = "option" | "upgrade" | "memorial" | "ato";

export function SelectContractItemDialog({
  open,
  onOpenChange,
  contractId,
  onAdd,
}: SelectContractItemDialogProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemType, setItemType] = useState<ItemType>("option");
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useContractItems(contractId);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrar opcionais baseado na busca
  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return data?.options || [];
    const term = debouncedSearchTerm.toLowerCase();
    return data?.options?.filter((option: any) =>
      option.name?.toLowerCase().includes(term) ||
      option.code?.toLowerCase().includes(term) ||
      option.description?.toLowerCase().includes(term)
    ) || [];
  }, [data?.options, debouncedSearchTerm]);

  // Filtrar upgrades baseado na busca
  const filteredUpgrades = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return data?.upgrades || [];
    const term = debouncedSearchTerm.toLowerCase();
    return data?.upgrades?.filter((upgrade: any) =>
      upgrade.name?.toLowerCase().includes(term) ||
      upgrade.code?.toLowerCase().includes(term) ||
      upgrade.description?.toLowerCase().includes(term)
    ) || [];
  }, [data?.upgrades, debouncedSearchTerm]);

  // Filtrar memorial items baseado na busca
  const filteredMemorialItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return data?.memorialItems || [];
    const term = debouncedSearchTerm.toLowerCase();
    return data?.memorialItems?.filter((item: any) =>
      item.item_name?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.brand?.toLowerCase().includes(term) ||
      item.model?.toLowerCase().includes(term)
    ) || [];
  }, [data?.memorialItems, debouncedSearchTerm]);

  // Filtrar itens de ATOs baseado na busca
  const filteredATOItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return data?.atoItems || [];
    const term = debouncedSearchTerm.toLowerCase();
    return data?.atoItems?.filter((item: any) =>
      item.item_name?.toLowerCase().includes(term) ||
      item.ato_number?.toLowerCase().includes(term) ||
      item.notes?.toLowerCase().includes(term)
    ) || [];
  }, [data?.atoItems, debouncedSearchTerm]);

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
              setSearchTerm(""); // Limpar busca ao trocar de aba
            }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="option" className="gap-1.5 text-xs">
                <Package className="h-4 w-4" />
                Opcionais ({filteredOptions.length})
              </TabsTrigger>
              <TabsTrigger value="upgrade" className="gap-1.5 text-xs">
                <ArrowUpCircle className="h-4 w-4" />
                Upgrades ({filteredUpgrades.length})
              </TabsTrigger>
              <TabsTrigger value="memorial" className="gap-1.5 text-xs">
                <Wrench className="h-4 w-4" />
                Memorial ({filteredMemorialItems.length})
              </TabsTrigger>
              <TabsTrigger value="ato" className="gap-1.5 text-xs">
                <FileEdit className="h-4 w-4" />
                ATOs ({filteredATOItems.length})
              </TabsTrigger>
            </TabsList>

            {/* Campo de busca */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  itemType === "option" ? "Buscar por nome, código ou descrição..." :
                  itemType === "upgrade" ? "Buscar por nome, código ou descrição..." :
                  itemType === "ato" ? "Buscar por nome ou número da ATO..." :
                  "Buscar por nome, descrição, marca ou modelo..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <TabsContent value="option" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredOptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum opcional encontrado
                    </div>
                  ) : (
                    filteredOptions.map((option: any) => (
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
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="upgrade" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredUpgrades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum upgrade encontrado no contrato
                    </div>
                  ) : (
                    filteredUpgrades.map((upgrade: any) => (
                    <div
                      key={upgrade.id}
                      onClick={() => setSelectedItem(upgrade)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedItem?.id === upgrade.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50 hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{upgrade.name}</h4>
                            {upgrade.code && <Badge variant="outline">{upgrade.code}</Badge>}
                          </div>
                          {upgrade.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {upgrade.description}
                            </p>
                          )}
                          {upgrade.memorial_item_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Upgrade de: {upgrade.memorial_item_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-primary">
                            {formatCurrency(upgrade.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="memorial" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredMemorialItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item encontrado
                    </div>
                  ) : (
                    filteredMemorialItems.map((item: any) => (
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
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ato" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredATOItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item de ATO aprovada encontrado
                    </div>
                  ) : (
                    filteredATOItems.map((item: any) => (
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
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.item_name}</h4>
                            <Badge variant="outline">{item.ato_number}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Tipo: {item.item_type}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    ))
                  )}
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
