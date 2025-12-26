import { X, Edit, Plus, FileText, Palette, ArrowUpCircle, Percent, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/quotation-utils";
import { cn } from "@/lib/utils";
export interface PendingATOItem {
  id: string;
  type: "edit_existing" | "add_optional" | "new_customization" | "define_finishing" | "add_upgrade";
  item_id?: string;
  item_name: string;
  notes?: string;
  quantity?: number;
  estimated_price?: number;
  estimated_days?: number;
  discount_percentage?: number;
  original_price?: number;
  replaces_upgrade?: {
    upgrade_id: string;
    upgrade_name: string;
    upgrade_price: number;
    source: string;
    delta?: number;
  };
}

interface ATOItemsListProps {
  items: PendingATOItem[];
  onRemove: (id: string) => void;
  onUpdateDiscount?: (id: string, discount: number) => void;
  readOnly?: boolean;
}

const TYPE_ICONS = {
  edit_existing: Edit,
  add_optional: Plus,
  new_customization: FileText,
  define_finishing: Palette,
  add_upgrade: ArrowUpCircle,
};

const TYPE_LABELS = {
  edit_existing: "Edição",
  add_optional: "Adicional",
  new_customization: "Customização",
  define_finishing: "Definição",
  add_upgrade: "Upgrade",
};

export function ATOItemsList({ items, onRemove, onUpdateDiscount, readOnly = false }: ATOItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum item adicionado ainda</p>
        <p className="text-sm mt-1">Clique em "Adicionar Item" para começar</p>
      </div>
    );
  }

  // Calcular preço com desconto por item
  const getDiscountedPrice = (item: PendingATOItem) => {
    const originalPrice = item.original_price || item.estimated_price || 0;
    const discount = item.discount_percentage || 0;
    return originalPrice * (1 - discount / 100);
  };

  // Calcular preço de exibição considerando delta para substituições
  const getDisplayPrice = (item: PendingATOItem) => {
    if (item.replaces_upgrade?.delta !== undefined) {
      const delta = item.replaces_upgrade.delta;
      const discount = item.discount_percentage || 0;
      return delta * (1 - discount / 100);
    }
    return getDiscountedPrice(item);
  };

  const totalEstimatedPrice = items.reduce((sum, item) => sum + getDisplayPrice(item), 0);
  const totalOriginalPrice = items.reduce((sum, item) => sum + (item.original_price || item.estimated_price || 0), 0);
  const maxEstimatedDays = Math.max(...items.map(item => item.estimated_days || 0), 0);
  const hasDiscounts = items.some(item => (item.discount_percentage || 0) > 0);
  const hasReplacements = items.some(item => item.replaces_upgrade?.delta !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold">Itens Adicionados ({items.length})</h3>
        <div className="flex gap-3 text-sm flex-wrap">
          {hasDiscounts && (
            <Badge variant="secondary" className="gap-1 line-through text-muted-foreground">
              {formatCurrency(totalOriginalPrice)}
            </Badge>
          )}
          <Badge variant="outline" className={cn(
            "gap-1",
            totalEstimatedPrice < 0 && "text-green-600 border-green-600",
            totalEstimatedPrice > 0 && "text-primary"
          )}>
            Impacto estimado: {totalEstimatedPrice >= 0 ? '+' : '-'} {formatCurrency(Math.abs(totalEstimatedPrice))}
          </Badge>
          {maxEstimatedDays > 0 && (
            <Badge variant="outline">
              +{maxEstimatedDays} dias
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = TYPE_ICONS[item.type];
          const originalPrice = item.original_price || item.estimated_price || 0;
          const discountedPrice = getDiscountedPrice(item);
          const hasDiscount = (item.discount_percentage || 0) > 0;
          
          // Verificar se é substituição de upgrade
          const isDelta = item.replaces_upgrade?.delta !== undefined;
          const deltaValue = isDelta ? item.replaces_upgrade!.delta : 0;
          const displayPrice = isDelta ? deltaValue : discountedPrice;
          const isPositiveDelta = isDelta && deltaValue > 0;
          const isNegativeDelta = isDelta && deltaValue < 0;

          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {TYPE_LABELS[item.type]}
                      </Badge>
                      <span className="font-semibold">{item.item_name}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-sm items-center flex-wrap">
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-muted-foreground">Qtd: {item.quantity}</span>
                      )}
                      
                      {/* Preço com/sem desconto - ou delta para substituições */}
                      {originalPrice > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Mostrar preço original riscado se tem desconto OU se é substituição */}
                          {(hasDiscount || isDelta) && (
                            <span className="text-muted-foreground line-through text-xs">
                              {formatCurrency(originalPrice)}
                            </span>
                          )}
                          
                          {/* Exibir valor: delta para substituições ou preço normal */}
                          <span className={cn(
                            "font-medium",
                            isDelta 
                              ? isPositiveDelta ? "text-destructive" : "text-green-600"
                              : "text-primary"
                          )}>
                            {isDelta && (isPositiveDelta ? '+' : '-')} 
                            {formatCurrency(Math.abs(isDelta ? displayPrice : discountedPrice))}
                          </span>
                          
                          {hasDiscount && !isDelta && (
                            <Badge variant="destructive" className="text-xs">
                              -{item.discount_percentage}%
                            </Badge>
                          )}
                          
                          {/* Badge de substituição */}
                          {isDelta && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <RefreshCw className="h-3 w-3" />
                              Substitui: {item.replaces_upgrade!.upgrade_name.length > 25 
                                ? item.replaces_upgrade!.upgrade_name.substring(0, 25) + '...'
                                : item.replaces_upgrade!.upgrade_name
                              }
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {item.estimated_days && item.estimated_days > 0 && (
                        <span className="text-muted-foreground">
                          +{item.estimated_days} dias
                        </span>
                      )}
                    </div>

                    {/* Campo de desconto por item (quando editável) */}
                    {!readOnly && onUpdateDiscount && originalPrice > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Desconto:
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          className="w-20 h-7 text-sm"
                          value={item.discount_percentage || 0}
                          onChange={(e) => {
                            const value = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                            onUpdateDiscount(item.id, value);
                          }}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    )}
                  </div>
                  
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
