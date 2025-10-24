import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, GripVertical } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const CATEGORIES = [
  { value: 'Ar-condicionado', label: 'Ar-condicionado', order: 1 },
  { value: 'Área da Cozinha', label: 'Área da Cozinha', order: 2 },
  { value: 'Área de Armazenamento de Popa', label: 'Área de Armazenamento de Popa', order: 3 },
  { value: 'Área de Jantar', label: 'Área de Jantar', order: 4 },
  { value: 'Banheiro da Cabine Master', label: 'Banheiro da Cabine Master', order: 5 },
  { value: 'Banheiro da Cabine VIP', label: 'Banheiro da Cabine VIP', order: 6 },
  { value: 'Banheiro da Tripulação', label: 'Banheiro da Tripulação', order: 7 },
  { value: 'Banheiro do Capitão', label: 'Banheiro do Capitão', order: 8 },
  { value: 'Banheiro dos Hóspedes', label: 'Banheiro dos Hóspedes', order: 9 },
  { value: 'Cabine da Tripulação', label: 'Cabine da Tripulação', order: 10 },
  { value: 'Cabine de Hóspedes BB', label: 'Cabine de Hóspedes BB', order: 11 },
  { value: 'Cabine de Hóspedes BE', label: 'Cabine de Hóspedes BE', order: 12 },
  { value: 'Cabine do Capitão', label: 'Cabine do Capitão', order: 13 },
  { value: 'Cabine Master', label: 'Cabine Master', order: 14 },
  { value: 'Cabine VIP', label: 'Cabine VIP', order: 15 },
  { value: 'Cabine VIP de Proa', label: 'Cabine VIP de Proa', order: 16 },
  { value: 'Características Externas', label: 'Características Externas', order: 17 },
  { value: 'Casco e Convés', label: 'Casco e Convés', order: 18 },
  { value: 'Comando Principal', label: 'Comando Principal', order: 19 },
  { value: 'Convés Principal', label: 'Convés Principal', order: 20 },
  { value: 'Cozinha/Galley', label: 'Cozinha/Galley', order: 21 },
  { value: 'Deck Principal', label: 'Deck Principal', order: 22 },
  { value: 'Elétrica', label: 'Elétrica', order: 23 },
  { value: 'Entretenimento', label: 'Entretenimento', order: 24 },
  { value: 'Flybridge', label: 'Flybridge', order: 25 },
  { value: 'Garagem', label: 'Garagem', order: 26 },
  { value: 'Lavabo', label: 'Lavabo', order: 27 },
  { value: 'Lobby do Convés Inferior', label: 'Lobby do Convés Inferior', order: 28 },
  { value: 'Lobby/Passagem da Tripulação', label: 'Lobby/Passagem da Tripulação', order: 29 },
  { value: 'Outros', label: 'Outros', order: 30 },
  { value: 'Plataforma de Popa', label: 'Plataforma de Popa', order: 31 },
  { value: 'Propulsão e Controle', label: 'Propulsão e Controle', order: 32 },
  { value: 'Sala de Máquinas', label: 'Sala de Máquinas', order: 33 },
  { value: 'Salão', label: 'Salão', order: 34 },
  { value: 'Segurança', label: 'Segurança', order: 35 },
  { value: 'Sistemas', label: 'Sistemas', order: 36 },
  { value: 'WC da Cabine Master', label: 'WC da Cabine Master', order: 37 },
  { value: 'WC VIP', label: 'WC VIP', order: 38 },
];

type Category = { value: string; label: string; order: number };

interface SortableItemProps {
  category: Category;
}

function SortableItem({ category }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.value });

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
        <p className="font-medium">{category.label}</p>
      </div>
      <span className="text-sm text-muted-foreground">Ordem: {category.order}</span>
    </div>
  );
}

interface CategoryOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yachtModelId: string;
}

export function CategoryOrderDialog({
  open,
  onOpenChange,
  yachtModelId,
}: CategoryOrderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState<Category[]>([...CATEGORIES]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Atualizar category_display_order de todos os itens do modelo
      const updates = categories.map((cat, index) => ({
        category: cat.value,
        new_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("memorial_items")
          .update({ category_display_order: update.new_order })
          .eq("yacht_model_id", yachtModelId)
          .eq("category", update.category as any);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Ordenação salva",
        description: "A ordem das categorias foi atualizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["memorial-items"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar ordenação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.value === active.id);
        const newIndex = items.findIndex((item) => item.value === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        
        // Atualizar orders
        return newArray.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ordenar Categorias do Memorial</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <p className="text-sm text-muted-foreground mb-4">
            Arraste as categorias para reordenar. Esta ordem será aplicada a todos os itens do memorial deste modelo.
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.value)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {categories.map((category) => (
                  <SortableItem key={category.value} category={category} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Ordenação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
