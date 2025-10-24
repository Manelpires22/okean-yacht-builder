import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GripVertical, Settings } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Database, AlertCircle, X, Check, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MemorialOkeanDialog } from "@/components/admin/memorial/MemorialOkeanDialog";
import { CategoryManagementDialog } from "@/components/admin/memorial/CategoryManagementDialog";
import {
  useMemorialOkeanItems,
  useMemorialOkeanCategories,
  useMemorialOkeanModelos,
  useDeleteMemorialItem,
  useUpdateMemorialItem,
  type MemorialOkeanItem,
} from "@/hooks/useMemorialOkean";
import { useUpdateCategoryOrder } from "@/hooks/useMemorialCategoryOrder";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MODEL_BADGE_COLORS: Record<string, string> = {
  'FY 550': "bg-blue-100 text-blue-800 border-blue-300",
  'FY 670': "bg-green-100 text-green-800 border-green-300",
  'FY 720': "bg-yellow-100 text-yellow-800 border-yellow-300",
  'FY 850': "bg-purple-100 text-purple-800 border-purple-300",
  'FY850': "bg-purple-100 text-purple-800 border-purple-300",
  'FY1000': "bg-orange-100 text-orange-800 border-orange-300",
  'OKEAN 52': "bg-red-100 text-red-800 border-red-300",
  'OKEAN 57': "bg-indigo-100 text-indigo-800 border-indigo-300",
  'OKEAN 80': "bg-pink-100 text-pink-800 border-pink-300",
};

interface SortableCategoryAccordionProps {
  categoria: string;
  categoryItems: MemorialOkeanItem[];
  categories: string[];
  onEditClick: (item: MemorialOkeanItem) => void;
  onDeleteClick: (id: number) => void;
  onChangeCategory: (itemId: number, newCategoria: string) => void;
  onManageCategory: (categoria: string, itemCount: number) => void;
}

function SortableCategoryAccordion({
  categoria,
  categoryItems,
  categories,
  onEditClick,
  onDeleteClick,
  onChangeCategory,
  onManageCategory,
}: SortableCategoryAccordionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoria });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem 
        value={categoria}
        className={cn(
          "border rounded-lg px-4",
          isDragging && "shadow-lg ring-2 ring-primary"
        )}
      >
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              <Badge variant="outline" className="font-semibold">
                {categoria}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
              </span>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageCategory(categoria, categoryItems.length);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[120px]">Modelo</TableHead>
                <TableHead>Descrição do Item</TableHead>
                <TableHead className="w-[180px]">Categoria</TableHead>
                <TableHead className="w-[80px] text-center">Qtd</TableHead>
                <TableHead className="w-[150px]">Marca</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead className="w-[80px] text-center">Custom</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium text-xs",
                        MODEL_BADGE_COLORS[item.modelo]
                      )}
                    >
                      {item.modelo}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[400px]">
                    <div className="truncate text-sm" title={item.descricao_item}>
                      {item.descricao_item}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.categoria}
                      onValueChange={(newCategoria) => 
                        onChangeCategory(item.id, newCategoria)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.quantidade || 1}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {item.marca || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {item.tipo_item}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.is_customizable !== false ? (
                      <Check className="h-4 w-4 text-success inline-block" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground inline-block" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteClick(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

export default function AdminMemorialOkean() {
  const queryClient = useQueryClient();
  const [selectedModelo, setSelectedModelo] = useState<string>("Todos");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("Todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MemorialOkeanItem | undefined>();
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [categoriesOrder, setCategoriesOrder] = useState<string[]>([]);
  const [categoryManagementDialog, setCategoryManagementDialog] = useState<{
    open: boolean;
    categoria: string;
    itemCount: number;
  } | null>(null);

  const { data: items = [], isLoading, error, refetch } = useMemorialOkeanItems(
    selectedModelo,
    selectedCategoria
  );
  const { data: categories = [] } = useMemorialOkeanCategories();
  const { data: modelos = [], refetch: refetchModelos } = useMemorialOkeanModelos();
  const deleteMutation = useDeleteMemorialItem();
  const updateItemMutation = useUpdateMemorialItem();
  const updateOrderMutation = useUpdateCategoryOrder();

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Force refetch models on mount to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['memorial-okean-modelos'] });
  }, [queryClient]);

  const handleCreateClick = () => {
    setEditingItem(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (item: MemorialOkeanItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingItemId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deletingItemId) {
      await deleteMutation.mutateAsync(deletingItemId);
      setDeletingItemId(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedModelo("Todos");
    setSelectedCategoria("Todas");
  };

  const handleRefreshModels = async () => {
    setIsRefreshingModels(true);
    await refetchModelos();
    toast.success("Lista de modelos atualizada!");
    setIsRefreshingModels(false);
  };

  const handleMigrateToYachtModels = async () => {
    setIsMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'migrate-memorial-okean-to-items'
      );

      if (error) throw error;

      toast.success("Migração concluída!", {
        description: `${data.items_migrated} itens migrados para ${data.models_processed} modelos`,
      });

      // Mostrar categorias não mapeadas se houver
      if (data.unmapped_categories?.length > 0) {
        toast.warning("Categorias não mapeadas encontradas", {
          description: `${data.unmapped_categories.length} categorias precisam de ajuste manual. Verifique os logs.`,
        });
        console.warn('Categorias não mapeadas:', data.unmapped_categories);
      }

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['memorial-items'] });
      
      console.log('📊 Relatório detalhado:', data);
    } catch (error: any) {
      toast.error("Erro na migração", {
        description: error.message,
      });
      console.error('Erro na migração:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleChangeCategoryItem = async (itemId: number, newCategoria: string) => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      await updateItemMutation.mutateAsync({
        id: itemId,
        modelo: item.modelo,
        categoria: newCategoria,
        descricao_item: item.descricao_item,
        tipo_item: item.tipo_item,
        quantidade: item.quantidade,
        is_customizable: item.is_customizable,
        marca: item.marca,
      });
    } catch (error) {
      console.error('Erro ao mudar categoria:', error);
    }
  };

  const handleManageCategory = (categoria: string, itemCount: number) => {
    setCategoryManagementDialog({
      open: true,
      categoria,
      itemCount,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategoriesOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Save to database
        if (selectedModelo && selectedModelo !== "Todos") {
          const categoriesOrder = newOrder.map((cat, idx) => ({
            categoria: cat,
            order: idx + 1,
          }));

          updateOrderMutation.mutate({
            modelo: selectedModelo,
            categoriesOrder,
          });
        }

        return newOrder;
      });
    }
  };

  const hasActiveFilters = selectedModelo !== "Todos" || selectedCategoria !== "Todas";

  // Agrupar itens por categoria e ordenar por category_display_order
  const itemsByCategory = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.categoria]) {
        acc[item.categoria] = [];
      }
      acc[item.categoria].push(item);
      return acc;
    }, {} as Record<string, MemorialOkeanItem[]>);

    // Sort by category_display_order from database
    return Object.entries(grouped).sort(([catA, itemsA], [catB, itemsB]) => {
      const orderA = (itemsA[0] as any)?.category_display_order ?? 999;
      const orderB = (itemsB[0] as any)?.category_display_order ?? 999;
      return orderA - orderB;
    });
  }, [items]);

  // Update categories order when items change
  useEffect(() => {
    if (itemsByCategory.length > 0) {
      setCategoriesOrder(itemsByCategory.map(([cat]) => cat));
    }
  }, [itemsByCategory]);

  // Paginação
  const totalPages = Math.ceil(itemsByCategory.length / itemsPerPage);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return itemsByCategory.slice(start, end);
  }, [itemsByCategory, currentPage, itemsPerPage]);

  // Reset página ao mudar filtros ou items per page
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Memorial OKEAN</h1>
            <p className="text-muted-foreground">
              Gerencie os itens do memorial descritivo
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        </div>

        {/* Migration Button */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Migração para Modelos de Iates</h3>
            <p className="text-sm text-muted-foreground">
              Migre os itens do Memorial OKEAN para os modelos específicos de iates. 
              Isso permitirá que os memoriais apareçam automaticamente na edição e configuração de cada modelo.
            </p>
          </div>
          <Button
            onClick={handleMigrateToYachtModels}
            disabled={isMigrating}
            size="lg"
            className="ml-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isMigrating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <Database className="mr-2 h-5 w-5" />
                Migrar Memorial
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Modelo:</label>
            <div className="flex gap-2 items-center">
              <Select value={selectedModelo} onValueChange={setSelectedModelo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {modelos.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>
                      {modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshModels}
                disabled={isRefreshingModels}
                title="Atualizar lista de modelos"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshingModels && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Categoria:</label>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          )}

          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar itens</AlertTitle>
            <AlertDescription>
              {error.message}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-4"
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Ajuste os filtros ou adicione um novo item
            </p>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </div>
        )}

        {/* Acordeon por Categoria + Paginação */}
        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-4">
            {/* Controles de Paginação */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Itens por página:</label>
                  <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="outline">
                  Mostrando {paginatedCategories.length} de {itemsByCategory.length} categorias
                </Badge>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>

            {/* Acordeon por Categoria com Drag & Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categoriesOrder.filter(cat => 
                  paginatedCategories.some(([c]) => c === cat)
                )}
                strategy={verticalListSortingStrategy}
              >
                <Accordion type="multiple" className="space-y-2">
                  {paginatedCategories.map(([categoria, categoryItems]) => (
                    <SortableCategoryAccordion
                      key={categoria}
                      categoria={categoria}
                      categoryItems={categoryItems}
                      categories={categories}
                      onEditClick={handleEditClick}
                      onDeleteClick={handleDeleteClick}
                      onChangeCategory={handleChangeCategoryItem}
                      onManageCategory={handleManageCategory}
                    />
                  ))}
                </Accordion>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <MemorialOkeanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editingItem}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deletingItemId !== null}
          onOpenChange={(open) => !open && setDeletingItemId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O item será permanentemente
                removido do memorial.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Category Management Dialog */}
        {categoryManagementDialog && (
          <CategoryManagementDialog
            open={categoryManagementDialog.open}
            onOpenChange={(open) => {
              if (!open) setCategoryManagementDialog(null);
            }}
            categoria={categoryManagementDialog.categoria}
            modelo={selectedModelo}
            itemCount={categoryManagementDialog.itemCount}
            allCategories={categories}
          />
        )}
      </div>
    </AdminLayout>
  );
}
