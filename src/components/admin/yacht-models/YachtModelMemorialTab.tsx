import { useState, useMemo } from "react";
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
import { Plus, Edit2, Trash, FileText, GripVertical } from "lucide-react";
import { MemorialItemDialog } from "@/components/admin/memorial/MemorialItemDialog";
import { CategoryOrderDialog } from "@/components/admin/memorial/CategoryOrderDialog";
import { useMemorialItems } from "@/hooks/useMemorialItems";

const CATEGORIES = [
  { value: 'Ar-condicionado', label: 'Ar-condicionado' },
  { value: 'Área da Cozinha', label: 'Área da Cozinha' },
  { value: 'Área de Armazenamento de Popa', label: 'Área de Armazenamento de Popa' },
  { value: 'Área de Jantar', label: 'Área de Jantar' },
  { value: 'Banheiro da Cabine Master', label: 'Banheiro da Cabine Master' },
  { value: 'Banheiro da Cabine VIP', label: 'Banheiro da Cabine VIP' },
  { value: 'Banheiro da Tripulação', label: 'Banheiro da Tripulação' },
  { value: 'Banheiro do Capitão', label: 'Banheiro do Capitão' },
  { value: 'Banheiro dos Hóspedes', label: 'Banheiro dos Hóspedes' },
  { value: 'Cabine da Tripulação', label: 'Cabine da Tripulação' },
  { value: 'Cabine de Hóspedes BB', label: 'Cabine de Hóspedes BB' },
  { value: 'Cabine de Hóspedes BE', label: 'Cabine de Hóspedes BE' },
  { value: 'Cabine do Capitão', label: 'Cabine do Capitão' },
  { value: 'Cabine Master', label: 'Cabine Master' },
  { value: 'Cabine VIP', label: 'Cabine VIP' },
  { value: 'Cabine VIP de Proa', label: 'Cabine VIP de Proa' },
  { value: 'Características Externas', label: 'Características Externas' },
  { value: 'Casco e Convés', label: 'Casco e Convés' },
  { value: 'Comando Principal', label: 'Comando Principal' },
  { value: 'Convés Principal', label: 'Convés Principal' },
  { value: 'Cozinha/Galley', label: 'Cozinha/Galley' },
  { value: 'Deck Principal', label: 'Deck Principal' },
  { value: 'Elétrica', label: 'Elétrica' },
  { value: 'Entretenimento', label: 'Entretenimento' },
  { value: 'Flybridge', label: 'Flybridge' },
  { value: 'Garagem', label: 'Garagem' },
  { value: 'Lavabo', label: 'Lavabo' },
  { value: 'Lobby do Convés Inferior', label: 'Lobby do Convés Inferior' },
  { value: 'Lobby/Passagem da Tripulação', label: 'Lobby/Passagem da Tripulação' },
  { value: 'Outros', label: 'Outros' },
  { value: 'Plataforma de Popa', label: 'Plataforma de Popa' },
  { value: 'Propulsão e Controle', label: 'Propulsão e Controle' },
  { value: 'Sala de Máquinas', label: 'Sala de Máquinas' },
  { value: 'Salão', label: 'Salão' },
  { value: 'Segurança', label: 'Segurança' },
  { value: 'Sistemas', label: 'Sistemas' },
  { value: 'WC da Cabine Master', label: 'WC da Cabine Master' },
  { value: 'WC VIP', label: 'WC VIP' },
] as const;

type CategoryValue = typeof CATEGORIES[number]['value'];

interface YachtModelMemorialTabProps {
  yachtModelId: string;
}

export function YachtModelMemorialTab({ yachtModelId }: YachtModelMemorialTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>(CATEGORIES[0].value);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const { data: items, isLoading: loadingItems, deleteItem, refetch } = useMemorialItems(yachtModelId);

  // Sort items by category_display_order first, then display_order
  const sortedItems = useMemo(() => {
    if (!items) return [];
    
    return [...items].sort((a, b) => {
      // 1. Ordenar por category_display_order (cast to any para evitar erro de tipo temporário)
      const catOrderDiff = ((a as any).category_display_order || 999) - ((b as any).category_display_order || 999);
      if (catOrderDiff !== 0) return catOrderDiff;
      
      // 2. Dentro da mesma categoria, ordenar por display_order
      return (a.display_order || 0) - (b.display_order || 0);
    });
  }, [items]);

  const itemsByCategory = useMemo(() => {
    const grouped: Partial<Record<CategoryValue, any[]>> = {};

    sortedItems?.forEach(item => {
      const category = item.category as CategoryValue;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }, [sortedItems]);

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOrderDialogOpen(true)}
          >
            <GripVertical className="mr-2 h-4 w-4" />
            Ordenar Categorias
          </Button>
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

      <CategoryOrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        yachtModelId={yachtModelId}
      />
    </div>
  );
}
