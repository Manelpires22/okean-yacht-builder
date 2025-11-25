import { X, Edit, Plus, FileText, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/quotation-utils";

export interface PendingATOItem {
  id: string;
  type: "edit_existing" | "add_optional" | "new_customization" | "define_finishing";
  item_id?: string;
  item_name: string;
  notes?: string;
  quantity?: number;
  estimated_price?: number;
  estimated_days?: number;
}

interface ATOItemsListProps {
  items: PendingATOItem[];
  onRemove: (id: string) => void;
}

const TYPE_ICONS = {
  edit_existing: Edit,
  add_optional: Plus,
  new_customization: FileText,
  define_finishing: Palette,
};

const TYPE_LABELS = {
  edit_existing: "Edição",
  add_optional: "Adicional",
  new_customization: "Customização",
  define_finishing: "Definição",
};

export function ATOItemsList({ items, onRemove }: ATOItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum item adicionado ainda</p>
        <p className="text-sm mt-1">Clique em "Adicionar Item" para começar</p>
      </div>
    );
  }

  const totalEstimatedPrice = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
  const maxEstimatedDays = Math.max(...items.map(item => item.estimated_days || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Itens Adicionados ({items.length})</h3>
        <div className="flex gap-3 text-sm">
          <Badge variant="outline" className="gap-1">
            Impacto estimado: {formatCurrency(totalEstimatedPrice)}
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
                    <div className="flex gap-3 mt-2 text-sm">
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-muted-foreground">Qtd: {item.quantity}</span>
                      )}
                      {item.estimated_price && item.estimated_price > 0 && (
                        <span className="text-primary font-medium">
                          {formatCurrency(item.estimated_price)}
                        </span>
                      )}
                      {item.estimated_days && item.estimated_days > 0 && (
                        <span className="text-muted-foreground">
                          +{item.estimated_days} dias
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
