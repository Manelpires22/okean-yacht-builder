import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

// Interface flexível para aceitar diferentes formatos de categoria
interface CategoryInfo {
  id: string;
  label: string;
  display_order: number;
}

interface MemorialItemInput {
  id: string;
  item_name: string;
  description?: string | null;
  brand?: string | null;
  model?: string | null;
  quantity: number;
  unit?: string | null;
  category_id: string;
  // Aceita tanto memorial_categories quanto category como objeto de categoria
  memorial_categories?: CategoryInfo;
  category?: CategoryInfo | string; // Pode ser objeto ou string (enum)
}

interface MemorialDescritivoAccordionProps {
  items: MemorialItemInput[];
}

export function MemorialDescritivoAccordion({ items }: MemorialDescritivoAccordionProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  // Agrupar itens por categoria usando memorial_categories ou category (se for objeto)
  const groupedItems = items.reduce((acc, item) => {
    // Priorizar memorial_categories, depois category se for objeto
    const categoryData = item.memorial_categories || 
      (typeof item.category === 'object' && item.category !== null ? item.category : null);
    
    const categoryLabel = categoryData?.label || "Outros";
    const categoryId = categoryData?.id || item.category_id || "outros";
    const displayOrder = categoryData?.display_order || 999;
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        label: categoryLabel,
        display_order: displayOrder,
        items: []
      };
    }
    
    acc[categoryId].items.push(item);
    return acc;
  }, {} as Record<string, { label: string; display_order: number; items: MemorialItemInput[] }>);

  // Ordenar categorias por display_order
  const sortedCategories = Object.entries(groupedItems).sort(
    ([, a], [, b]) => a.display_order - b.display_order
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum item no memorial descritivo</p>
      </div>
    );
  }

  return (
    <Accordion 
      type="multiple" 
      value={expanded}
      onValueChange={setExpanded}
      className="space-y-2"
    >
      {sortedCategories.map(([categoryId, category]) => (
        <AccordionItem 
          key={categoryId} 
          value={categoryId}
          className="border rounded-lg px-4 bg-card"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-left">{category.label}</span>
              <Badge variant="secondary" className="ml-auto mr-4">
                {category.items.length} {category.items.length === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-3">
              {category.items.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.item_name}</p>
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.brand && item.brand !== "null" && (
                          <Badge variant="outline" className="text-xs">
                            Marca: {item.brand}
                          </Badge>
                        )}
                        {item.model && item.model !== "null" && (
                          <Badge variant="outline" className="text-xs">
                            Modelo: {item.model}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Quantidade</p>
                      <p className="text-sm font-semibold">
                        {item.quantity} {item.unit || 'un'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
