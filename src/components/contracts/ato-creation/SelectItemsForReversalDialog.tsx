import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/quotation-utils";
import { cn } from "@/lib/utils";
import { RotateCcw, RefreshCw, Percent, CreditCard } from "lucide-react";
import { PendingATOItem } from "./ATOItemsList";

interface ReversalItem {
  id: string;
  item_type: string;
  item_id: string | null;
  item_name: string;
  original_price: number;
  discount_percentage: number;
  calculated_price: number | null;
  selected: boolean;
  reversal_percentage: number;
  reversal_reason: string;
}

interface SelectItemsForReversalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalAtoId: string;
  onConfirm: (items: PendingATOItem[]) => void;
}

export function SelectItemsForReversalDialog({
  open,
  onOpenChange,
  originalAtoId,
  onConfirm,
}: SelectItemsForReversalDialogProps) {
  const [reversalItems, setReversalItems] = useState<ReversalItem[]>([]);

  // Buscar configurações da ATO original
  const { data: originalConfigs, isLoading } = useQuery({
    queryKey: ["ato-configurations-for-reversal", originalAtoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ato_configurations")
        .select("*")
        .eq("ato_id", originalAtoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open && !!originalAtoId,
  });

  // Buscar dados da ATO original
  const { data: originalAto } = useQuery({
    queryKey: ["ato-for-reversal", originalAtoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("additional_to_orders")
        .select("ato_number, title, price_impact")
        .eq("id", originalAtoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!originalAtoId,
  });

  // Inicializar itens de reversão quando configs carregarem
  useEffect(() => {
    if (originalConfigs) {
      setReversalItems(
        originalConfigs.map((config: any) => ({
          id: config.id,
          item_type: config.item_type,
          item_id: config.item_id,
          item_name: config.configuration_details?.item_name || config.notes || "Item",
          original_price: config.calculated_price || config.original_price || 0,
          discount_percentage: config.discount_percentage || 0,
          calculated_price: config.calculated_price,
          selected: false,
          reversal_percentage: 100,
          reversal_reason: "",
        }))
      );
    }
  }, [originalConfigs]);

  // Calcular totais
  const { selectedItems, totalOriginalPrice, totalCredit } = useMemo(() => {
    const selected = reversalItems.filter((item) => item.selected);
    const originalTotal = selected.reduce((sum, item) => sum + item.original_price, 0);
    const creditTotal = selected.reduce(
      (sum, item) => sum + (item.original_price * item.reversal_percentage) / 100,
      0
    );
    return {
      selectedItems: selected,
      totalOriginalPrice: originalTotal,
      totalCredit: creditTotal,
    };
  }, [reversalItems]);

  const handleToggleItem = (id: string) => {
    setReversalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleUpdatePercentage = (id: string, percentage: number) => {
    setReversalItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, reversal_percentage: Math.min(100, Math.max(0, percentage)) }
          : item
      )
    );
  };

  const handleUpdateReason = (id: string, reason: string) => {
    setReversalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, reversal_reason: reason } : item
      )
    );
  };

  const handleConfirm = () => {
    const pendingItems: PendingATOItem[] = selectedItems.map((item) => ({
      id: crypto.randomUUID(),
      type: "reversal" as const,
      item_id: item.item_id || undefined,
      item_name: `Estorno: ${item.item_name}`,
      notes: item.reversal_reason || undefined,
      quantity: 1,
      // Preço negativo (crédito)
      estimated_price: -((item.original_price * item.reversal_percentage) / 100),
      original_price: item.original_price,
      estimated_days: 0,
      discount_percentage: 0,
      // Campos adicionais para reversão
      is_reversal: true,
      reversal_of_configuration_id: item.id,
      reversal_percentage: item.reversal_percentage,
      reversal_reason: item.reversal_reason,
    }));

    onConfirm(pendingItems);
    onOpenChange(false);
  };

  const handleSelectAll = () => {
    const allSelected = reversalItems.every((item) => item.selected);
    setReversalItems((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            Selecionar Itens para Estorno
          </DialogTitle>
          <DialogDescription>
            Selecione os itens da {originalAto?.ato_number} que serão estornados e defina
            o percentual de devolução para cada item.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : reversalItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum item encontrado na ATO original</p>
          </div>
        ) : (
          <>
            {/* Header com seleção global */}
            <div className="flex items-center justify-between py-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-sm"
              >
                {reversalItems.every((item) => item.selected)
                  ? "Desmarcar Todos"
                  : "Selecionar Todos"}
              </Button>
              <Badge variant="outline">
                {selectedItems.length} de {reversalItems.length} selecionados
              </Badge>
            </div>

            {/* Lista de itens */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {reversalItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "border rounded-lg p-4 transition-colors",
                      item.selected
                        ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => handleToggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{item.item_name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {item.item_type}
                            </Badge>
                          </div>
                          <span className="font-semibold text-primary">
                            {formatCurrency(item.original_price)}
                          </span>
                        </div>

                        {item.selected && (
                          <div className="space-y-3 pt-2 border-t">
                            {/* Percentual de devolução */}
                            <div className="flex items-center gap-4">
                              <Label className="text-sm text-muted-foreground flex items-center gap-1 min-w-[120px]">
                                <Percent className="h-3 w-3" />
                                Devolução:
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={item.reversal_percentage}
                                  onChange={(e) =>
                                    handleUpdatePercentage(
                                      item.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 h-8"
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                                <span className="text-green-600 font-medium">
                                  = - {formatCurrency((item.original_price * item.reversal_percentage) / 100)}
                                </span>
                              </div>
                            </div>

                            {/* Motivo do estorno */}
                            <div className="space-y-1">
                              <Label className="text-sm text-muted-foreground">
                                Motivo (opcional):
                              </Label>
                              <Textarea
                                placeholder="Ex: Cliente desistiu, item não será mais necessário..."
                                value={item.reversal_reason}
                                onChange={(e) =>
                                  handleUpdateReason(item.id, e.target.value)
                                }
                                rows={2}
                                className="text-sm"
                              />
                            </div>

                            {item.reversal_percentage < 100 && (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ Devolução parcial: Cliente receberá{" "}
                                {item.reversal_percentage}% do valor original
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Resumo */}
            {selectedItems.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor original dos itens:</span>
                  <span className="line-through text-muted-foreground">
                    {formatCurrency(totalOriginalPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    Total de Crédito ao Cliente:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    - {formatCurrency(totalCredit)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Confirmar Estorno ({selectedItems.length} {selectedItems.length === 1 ? "item" : "itens"})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
