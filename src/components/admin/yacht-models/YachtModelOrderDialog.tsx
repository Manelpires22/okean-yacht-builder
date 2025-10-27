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
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateYachtModelOrder } from "@/hooks/useYachtModelOrder";

interface YachtModel {
  id: string;
  code: string;
  name: string;
  display_order: number;
}

interface SortableItemProps {
  id: string;
  code: string;
  name: string;
  order: number;
}

function SortableItem({ id, code, name, order }: SortableItemProps) {
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
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{code}</p>
      </div>
      <span className="text-sm text-muted-foreground">Ordem: {order}</span>
    </div>
  );
}

interface YachtModelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function YachtModelOrderDialog({
  open,
  onOpenChange,
}: YachtModelOrderDialogProps) {
  const { data: modelsData, isLoading } = useQuery({
    queryKey: ["admin-yacht-models-order"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yacht_models")
        .select("id, code, name, display_order")
        .order("display_order")
        .order("code");

      if (error) throw error;
      return data as YachtModel[];
    },
    enabled: open,
  });

  const updateOrder = useUpdateYachtModelOrder();
  const [models, setModels] = useState<YachtModel[]>([]);

  useEffect(() => {
    if (modelsData) {
      setModels(modelsData);
    }
  }, [modelsData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setModels((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    const updates = models.map((model, index) => ({
      id: model.id,
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
          <DialogTitle>Ordenar Modelos de Iates</DialogTitle>
          <DialogDescription>
            Arraste os modelos para reorganizá-los na ordem desejada
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
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
                items={models.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {models.map((model, index) => (
                    <SortableItem
                      key={model.id}
                      id={model.id}
                      code={model.code}
                      name={model.name}
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
