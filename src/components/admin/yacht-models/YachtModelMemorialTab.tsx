import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Trash, FileText } from "lucide-react";
import { MemorialItemDialog } from "@/components/admin/memorial/MemorialItemDialog";
import { PopulateFY850Button } from "./PopulateFY850Button";
import { useMemorialItems } from "@/hooks/useMemorialItems";

const CATEGORIES = [
  { value: 'motorizacao', label: 'Motorização' },
  { value: 'sistema_eletrico', label: 'Sistema Elétrico' },
  { value: 'sistema_hidraulico', label: 'Sistema Hidráulico' },
  { value: 'acabamentos', label: 'Acabamentos' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'conforto', label: 'Conforto' },
  { value: 'outros', label: 'Outros' },
] as const;

type CategoryValue = typeof CATEGORIES[number]['value'];

interface YachtModelMemorialTabProps {
  yachtModelId: string;
}

export function YachtModelMemorialTab({ yachtModelId }: YachtModelMemorialTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>(CATEGORIES[0].value);

  const { data: items, isLoading: loadingItems, deleteItem, refetch } = useMemorialItems(yachtModelId);

  // Buscar código do modelo para o botão de população FY850
  const { data: model } = useQuery({
    queryKey: ['yacht-model-code', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yacht_models')
        .select('code')
        .eq('id', yachtModelId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!yachtModelId,
  });

  const itemsByCategory = useMemo(() => {
    const grouped: Record<CategoryValue, any[]> = {
      motorizacao: [],
      sistema_eletrico: [],
      sistema_hidraulico: [],
      acabamentos: [],
      equipamentos: [],
      seguranca: [],
      conforto: [],
      outros: [],
    };

    items?.forEach(item => {
      if (grouped[item.category as CategoryValue]) {
        grouped[item.category as CategoryValue].push(item);
      }
    });

    return grouped;
  }, [items]);

  const handleCreate = (category?: CategoryValue) => {
    setEditingItem(null);
    setSelectedCategory(category || selectedCategory);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Tem certeza que deseja deletar este item?')) {
      await deleteItem(itemId);
    }
  };

  // Find first category with items for default open
  const defaultOpenCategory = useMemo(() => {
    const catWithItems = CATEGORIES.find(cat => itemsByCategory[cat.value]?.length > 0);
    return catWithItems?.value || CATEGORIES[0].value;
  }, [itemsByCategory]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Itens do Memorial Descritivo</h2>
          <p className="text-sm text-muted-foreground">
            Gerir itens técnicos e equipamentos do modelo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PopulateFY850Button 
            yachtModelCode={model?.code || ''} 
            onSuccess={refetch}
          />
          <Button onClick={() => handleCreate()}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </div>
      </div>

      <Accordion type="single" collapsible defaultValue={defaultOpenCategory} className="w-full">
        {CATEGORIES.map(cat => {
          const categoryItems = itemsByCategory[cat.value] || [];
          const itemCount = categoryItems.length;

          return (
            <AccordionItem key={cat.value} value={cat.value}>
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <span>{cat.label}</span>
                  <Badge variant="outline" className="ml-auto mr-2">
                    {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {loadingItems ? (
                  <div className="border rounded-lg p-8">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : categoryItems.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ordem</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Customizável?</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono">{item.display_order}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.item_name}</p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.brand || '-'}</TableCell>
                            <TableCell>{item.model || '-'}</TableCell>
                            <TableCell>
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.is_customizable ? 'default' : 'secondary'}>
                                {item.is_customizable ? 'Sim' : 'Não'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                {item.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="border rounded-lg p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Nenhum item nesta categoria
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Adicione itens ao memorial descritivo desta categoria
                    </p>
                    <Button onClick={() => handleCreate(cat.value)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Item
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <MemorialItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        yachtModelId={yachtModelId}
        initialData={editingItem}
        defaultCategory={selectedCategory}
      />
    </div>
  );
}
