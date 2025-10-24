import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Trash2, Plus, GripVertical, ArrowUpDown, Merge } from "lucide-react";
import React, { useState } from "react";
import {
  useMemorialCategories,
  useDeleteCategory,
  useUpdateCategoryOrder,
} from "@/hooks/useMemorialCategories";
import { CategoryDialog } from "@/components/admin/memorial/CategoryDialog";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MemorialCategory } from "@/types/memorial";
import { toast } from "sonner";
import { useMemorialCategoryStats } from "@/hooks/useMemorialCategoryStats";
import { MergeCategoriesDialog } from "@/components/admin/memorial/MergeCategoriesDialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface SortableRowProps {
  category: MemorialCategory;
  itemCount: number;
  modelNames: string[];
  onEdit: (category: MemorialCategory) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ category, itemCount, modelNames, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{category.display_order}</TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {category.value}
        </code>
      </TableCell>
      <TableCell className="font-medium">{category.label}</TableCell>
      <TableCell className="max-w-md truncate text-muted-foreground">
        {category.description || "—"}
      </TableCell>
      <TableCell>
        <Badge variant={itemCount > 0 ? "default" : "secondary"}>
          {itemCount} {itemCount === 1 ? "item" : "itens"}
        </Badge>
      </TableCell>
      <TableCell>
        {modelNames.length > 0 ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Badge variant="outline" className="cursor-pointer">
                {modelNames.length} {modelNames.length === 1 ? "modelo" : "modelos"}
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Modelos usando esta categoria:</h4>
                <div className="flex flex-wrap gap-1">
                  {modelNames.map((name, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        {category.icon ? (
          <Badge variant="outline">{category.icon}</Badge>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        <Badge variant={category.is_active ? "default" : "secondary"}>
          {category.is_active ? "Ativa" : "Inativa"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(category)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminMemorialCategories() {
  const [editingCategory, setEditingCategory] = useState<MemorialCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const { data: categoriesData, isLoading } = useMemorialCategories();
  const { data: stats = [] } = useMemorialCategoryStats();
  const deleteMutation = useDeleteCategory();
  const updateOrderMutation = useUpdateCategoryOrder();

  const [categories, setCategories] = useState<MemorialCategory[]>([]);

  // Update local state when data changes
  React.useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);

        // Update display_order based on new positions
        const updates = newArray.map((cat, index) => ({
          id: cat.id,
          display_order: index + 1,
        }));

        // Save to database
        updateOrderMutation.mutate(updates);

        return newArray;
      });
    }
  };

  const handleCreateClick = () => {
    setEditingCategory(null);
    setIsCreating(true);
  };

  const handleEditClick = (category: MemorialCategory) => {
    setEditingCategory(category);
    setIsCreating(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    // Verificar se tem itens antes de deletar
    const categoryStats = stats.find(s => s.category_id === deletingId);
    if (categoryStats && categoryStats.item_count > 0) {
      toast.error(
        `Não é possível deletar. Esta categoria tem ${categoryStats.item_count} itens. Mova-os para outra categoria primeiro ou use a opção Mesclar.`
      );
      setDeletingId(null);
      return;
    }

    try {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categorias do Memorial</h1>
            <p className="text-muted-foreground">
              Gerir categorias para organização do memorial descritivo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowMergeDialog(true)}>
              <Merge className="h-4 w-4 mr-2" />
              Mesclar Categorias
            </Button>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <ArrowUpDown className="h-4 w-4" />
          <span>
            Arraste as linhas para reorganizar a ordem de exibição das categorias
          </span>
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Modelos</TableHead>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(10)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Modelos</TableHead>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={categories.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categories.map((category) => {
                      const categoryStats = stats.find(s => s.category_id === category.id);
                      return (
                        <SortableRow
                          key={category.id}
                          category={category}
                          itemCount={categoryStats?.item_count || 0}
                          modelNames={categoryStats?.model_names || []}
                          onEdit={handleEditClick}
                          onDelete={setDeletingId}
                        />
                      );
                    })}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </div>
      </div>

      <CategoryDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        category={editingCategory}
      />

      <MergeCategoriesDialog
        open={showMergeDialog}
        onOpenChange={setShowMergeDialog}
        categories={categories}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const categoryStats = stats.find(s => s.category_id === deletingId);
                if (categoryStats && categoryStats.item_count > 0) {
                  return `Esta categoria tem ${categoryStats.item_count} itens associados. Mova-os para outra categoria ou use a opção Mesclar antes de deletar.`;
                }
                return "Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
