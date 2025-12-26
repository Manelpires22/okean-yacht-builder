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
import { Loader2, Search, CheckCircle2, FileText } from "lucide-react";
import { useMemorialUpgrades } from "@/hooks/useMemorialUpgrades";
import { useItemUsageCheck } from "@/hooks/useItemUsageCheck";
import { formatCurrency } from "@/lib/quotation-utils";
import { PendingATOItem } from "./ATOItemsList";

interface SelectAvailableUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yachtModelId: string;
  contractId?: string;
  onAdd: (item: PendingATOItem) => void;
}

export function SelectAvailableUpgradeDialog({
  open,
  onOpenChange,
  yachtModelId,
  contractId,
  onAdd,
}: SelectAvailableUpgradeDialogProps) {
  const [selectedUpgrade, setSelectedUpgrade] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const { data: upgrades, isLoading } = useMemorialUpgrades(yachtModelId);
  const { getUpgradeStatus } = useItemUsageCheck(contractId);

  const filteredUpgrades = upgrades?.filter(
    (upgrade) =>
      upgrade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upgrade.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (!selectedUpgrade) return;

    onAdd({
      id: crypto.randomUUID(),
      type: "add_upgrade",
      item_id: selectedUpgrade.id,
      item_name: selectedUpgrade.name,
      notes: notes || undefined,
      quantity,
      estimated_price: selectedUpgrade.price * quantity,
      estimated_days: selectedUpgrade.delivery_days_impact || 0,
    });

    setSelectedUpgrade(null);
    setSearchQuery("");
    setQuantity(1);
    setNotes("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedUpgrade(null);
    setSearchQuery("");
    setQuantity(1);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Upgrade</DialogTitle>
          <DialogDescription>
            Selecione um upgrade disponível para os itens do memorial
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
              {filteredUpgrades?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum upgrade encontrado
                </div>
              )}
              {filteredUpgrades?.map((upgrade) => {
                const usageStatus = getUpgradeStatus(upgrade.id);
                return (
                  <div
                    key={upgrade.id}
                    onClick={() => setSelectedUpgrade(upgrade)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedUpgrade?.id === upgrade.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold">{upgrade.name}</h4>
                          <Badge variant="outline">{upgrade.code}</Badge>
                          {usageStatus?.inContract && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              No contrato
                            </Badge>
                          )}
                          {usageStatus?.inATOs.map((atoLabel) => (
                            <Badge 
                              key={atoLabel} 
                              variant="outline" 
                              className="text-xs gap-1 border-amber-500 text-amber-600"
                            >
                              <FileText className="h-3 w-3" />
                              Já em {atoLabel}
                            </Badge>
                          ))}
                        </div>
                        {upgrade.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {upgrade.description}
                          </p>
                        )}
                        {upgrade.memorial_item && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Item: {upgrade.memorial_item.item_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-primary">
                          {formatCurrency(upgrade.price)}
                        </p>
                        {upgrade.delivery_days_impact > 0 && (
                          <p className="text-xs text-muted-foreground">
                            +{upgrade.delivery_days_impact} dias
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {selectedUpgrade && (
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
                  {formatCurrency(selectedUpgrade.price * quantity)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações (Opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre este upgrade..."
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedUpgrade}>
            Adicionar à ATO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
