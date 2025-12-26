import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryChecklistItemComponent } from "./DeliveryChecklistItem";
import { DeliveryChecklistItem } from "@/hooks/useContractDeliveryChecklist";
import { Package, Settings, Plus, FileText, ArrowUpCircle, Wrench } from "lucide-react";

interface DeliveryChecklistProps {
  items: DeliveryChecklistItem[];
  isLoading?: boolean;
}

const ITEM_TYPE_CONFIG = {
  option: {
    label: "Opcionais Contratados",
    icon: Package,
  },
  upgrade: {
    label: "Upgrades do Memorial",
    icon: ArrowUpCircle,
  },
  customization: {
    label: "Customizações",
    icon: Settings,
  },
  ato_item: {
    label: "ATOs Aprovadas",
    icon: Plus,
  },
  ato_config_item: {
    label: "Definições de ATOs",
    icon: Wrench,
  },
  memorial_item: {
    label: "Itens de Memorial",
    icon: FileText,
  },
};

export function DeliveryChecklist({ items, isLoading }: DeliveryChecklistProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum item encontrado no checklist de entrega.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar itens por tipo
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.item_type]) {
      acc[item.item_type] = [];
    }
    acc[item.item_type].push(item);
    return acc;
  }, {} as Record<string, DeliveryChecklistItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([type, typeItems]) => {
        const config = ITEM_TYPE_CONFIG[type as keyof typeof ITEM_TYPE_CONFIG];
        const Icon = config.icon;
        const verifiedCount = typeItems.filter((item) => item.is_verified).length;

        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {config.label}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {verifiedCount}/{typeItems.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {typeItems.map((item) => (
                <DeliveryChecklistItemComponent key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
