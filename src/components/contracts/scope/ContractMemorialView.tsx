import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MemorialItem {
  id: string;
  item_name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  quantity: number;
  unit: string;
  category?: {
    id: string;
    label: string;
    value: string;
    display_order: number;
  };
}

interface ContractMemorialViewProps {
  items: MemorialItem[];
}

export function ContractMemorialView({ items }: ContractMemorialViewProps) {
  // Agrupar por categoria
  const grouped = items.reduce((acc, item) => {
    const categoryLabel = item.category?.label || "Outros";
    if (!acc[categoryLabel]) {
      acc[categoryLabel] = {
        items: [],
        displayOrder: item.category?.display_order || 999,
      };
    }
    acc[categoryLabel].items.push(item);
    return acc;
  }, {} as Record<string, { items: MemorialItem[]; displayOrder: number }>);

  const sortedCategories = Object.entries(grouped).sort(
    (a, b) => a[1].displayOrder - b[1].displayOrder
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum item de memorial disponível
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Memorial Descritivo Base</h3>
        <Badge variant="outline">{items.length} itens</Badge>
      </div>

      <Accordion type="multiple" className="w-full space-y-2">
        {sortedCategories.map(([categoryLabel, { items: categoryItems }]) => (
          <AccordionItem
            key={categoryLabel}
            value={categoryLabel}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="font-semibold">{categoryLabel}</span>
                <Badge variant="secondary">{categoryItems.length} itens</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {categoryItems.map((item) => (
                  <Card key={item.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{item.item_name}</h4>
                          <Badge variant="outline">
                            {item.quantity} {item.unit}
                          </Badge>
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}

                        {(item.brand || item.model) && (
                          <div className="flex gap-4 text-sm">
                            {item.brand && (
                              <span>
                                <strong>Marca:</strong> {item.brand}
                              </span>
                            )}
                            {item.model && (
                              <span>
                                <strong>Modelo:</strong> {item.model}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
