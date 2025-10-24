import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { GripVertical, Loader2 } from "lucide-react";
import { useMemorialCategories, useUpdateCategoryOrder } from "@/hooks/useMemorialCategories";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  value: string;
  label: string;
  display_order: number;
}

interface SortableItemProps {
  id: string;
  label: string;
  order: number;
}

function SortableItem({ id, label, order }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
      </div>
      <span className="text-sm text-muted-foreground">Ordem: {order}</span>
    </div>
  );
}

interface CategoryOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryOrderDialog({
  open,
  onOpenChange,
}: CategoryOrderDialogProps) {
  const { data: categoriesData, isLoading } = useMemorialCategories();
  const updateOrder = useUpdateCategoryOrder();
  
  const [categories, setCategories] = useState<Category[]>([]);

  // Update local state when data is loaded
  useEffect(() => {
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
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    // Update display_order based on current position
    const updates = categories.map((cat, index) => ({
      id: cat.id,
      display_order: index + 1,
    }));

    updateOrder.mutate(updates, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ordenar Categorias do Memorial</DialogTitle>
          <DialogDescription>
            Arraste as categorias para reorganizá-las na ordem desejada
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {categories.map((category, index) => (
                    <SortableItem
                      key={category.id}
                      id={category.id}
                      label={category.label}
                      order={index + 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={updateOrder.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateOrder.isPending || isLoading}
          >
            {updateOrder.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Ordenação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
