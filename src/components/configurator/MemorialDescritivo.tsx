import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface MemorialDescritivoProps {
  yachtModelId: string;
  modelName: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'dimensoes': 'Dimensões',
  'motorizacao': 'Motorização',
  'sistema_eletrico': 'Sistema Elétrico',
  'sistema_hidraulico': 'Sistema Hidráulico',
  'acabamentos': 'Acabamentos',
  'equipamentos': 'Equipamentos',
  'seguranca': 'Segurança',
  'conforto': 'Conforto',
  'outros': 'Outros',
};

export function MemorialDescritivo({ yachtModelId, modelName }: MemorialDescritivoProps) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['memorial-items-public', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_items')
        .select('*')
        .eq('yacht_model_id', yachtModelId)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
    enabled: !!yachtModelId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memorial Descritivo - {modelName}</CardTitle>
          <CardDescription>Especificações técnicas não disponíveis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memorial Descritivo - {modelName}</CardTitle>
        <CardDescription>
          Especificações técnicas e características do modelo base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(groupedItems).map(([category, categoryItems], index) => (
            <AccordionItem key={index} value={`category-${index}`}>
              <AccordionTrigger className="text-left">
                {CATEGORY_LABELS[category] || category}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="border-l-2 border-primary pl-4 py-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{item.item_name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.brand && (
                              <Badge variant="outline">
                                Marca: {item.brand}
                              </Badge>
                            )}
                            {item.model && (
                              <Badge variant="outline">
                                Modelo: {item.model}
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {item.quantity} {item.unit}
                            </Badge>
                          </div>
                        </div>

                        {item.is_customizable && (
                          <Badge variant="default" className="shrink-0">
                            Customizável
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
