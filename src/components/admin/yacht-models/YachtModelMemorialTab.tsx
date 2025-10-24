import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash, FileText } from "lucide-react";
import { MemorialItemDialog } from "@/components/admin/memorial/MemorialItemDialog";
import { useMemorialItems } from "@/hooks/useMemorialItems";
import { useMemorialCategories } from "@/hooks/useMemorialCategories";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CategoryOrderDialog } from "@/components/admin/memorial/CategoryOrderDialog";

interface YachtModelMemorialTabProps {
  yachtModelId: string;
}

export function YachtModelMemorialTab({ yachtModelId }: YachtModelMemorialTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>();
  
  const { data: items, isLoading, deleteItem, isDeleting } = useMemorialItems(yachtModelId);
  const { data: categories } = useMemorialCategories();

  // Sort items by category display_order, then by item display_order
  const sortedItems = useMemo(() => {
    if (!items) return [];
    
    return [...items].sort((a, b) => {
      // First by category display_order
      const catOrderDiff = (a.category?.display_order || 999) - (b.category?.display_order || 999);
      if (catOrderDiff !== 0) return catOrderDiff;
      
      // Then by item display_order
      return (a.display_order || 0) - (b.display_order || 0);
    });
  }, [items]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    if (!sortedItems || !categories) return {};
    
    return sortedItems.reduce((acc, item) => {
      const categoryLabel = item.category?.label || 'Outros';
      
      if (!acc[categoryLabel]) {
        acc[categoryLabel] = [];
      }
      acc[categoryLabel].push(item);
      return acc;
    }, {} as Record<string, typeof sortedItems>);
  }, [sortedItems, categories]);

  const handleCreate = (categoryId?: string) => {
    setEditingItem(null);
    setDefaultCategoryId(categoryId);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setDefaultCategoryId(undefined);
    setDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("Tem certeza que deseja deletar este item?")) {
      deleteItem(itemId);
    }
  };

  // Find first category with items for default open
  const defaultOpenCategory = useMemo(() => {
    const firstCategoryWithItems = Object.keys(itemsByCategory)[0];
    return firstCategoryWithItems || "";
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOrderDialogOpen(true)}>
            <GripVertical className="mr-2 h-4 w-4" />
            Ordenar Categorias
          </Button>
          <Button onClick={() => handleCreate()}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : Object.keys(itemsByCategory).length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum item cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Adicione itens ao memorial descritivo deste modelo de iate
          </p>
          <Button onClick={() => handleCreate()}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Primeiro Item
          </Button>
        </div>
      ) : (
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          defaultValue={defaultOpenCategory}
        >
          {Object.entries(itemsByCategory).map(([categoryLabel, categoryItems]) => {
            const firstItem = categoryItems[0];
            const categoryId = firstItem?.category?.id;
            
            return (
              <AccordionItem key={categoryLabel} value={categoryLabel}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold">{categoryLabel}</span>
                    <span className="text-sm text-muted-foreground">
                      {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex justify-end mb-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCreate(categoryId)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item em {categoryLabel}
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Ordem</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Qtd.</TableHead>
                        <TableHead>Customizável</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {item.display_order}
                          </TableCell>
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
                          <TableCell>{item.brand || "-"}</TableCell>
                          <TableCell>{item.model || "-"}</TableCell>
                          <TableCell>
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.is_customizable ? "default" : "secondary"}>
                              {item.is_customizable ? "Sim" : "Não"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                disabled={isDeleting}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          </Accordion>
      )}

      <MemorialItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        yachtModelId={yachtModelId}
        initialData={editingItem}
        defaultCategoryId={defaultCategoryId}
      />

      <CategoryOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
      />
    </div>
  );
}
