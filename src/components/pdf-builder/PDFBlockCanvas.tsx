import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { PDFBlock } from "@/types/pdf-builder";
import { PDFBlockItem } from "./PDFBlockItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface PDFBlockCanvasProps {
  blocks: PDFBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onRemoveBlock: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function PDFBlockCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onRemoveBlock,
  onToggleVisibility,
}: PDFBlockCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  });

  return (
    <div className="flex flex-col h-full bg-muted/30 rounded-lg border">
      <div className="p-4 border-b bg-background rounded-t-lg">
        <h3 className="font-semibold text-sm">Estrutura do Documento</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {blocks.length} bloco{blocks.length !== 1 ? "s" : ""} • Arraste para reordenar
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          className={cn(
            "p-4 min-h-[400px] transition-colors",
            isOver && "bg-primary/5"
          )}
        >
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm font-medium">Nenhum bloco adicionado</p>
              <p className="text-xs mt-1">
                Arraste blocos da biblioteca para cá
              </p>
            </div>
          ) : (
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {blocks.map((block) => (
                  <PDFBlockItem
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => onSelectBlock(block.id)}
                    onRemove={() => onRemoveBlock(block.id)}
                    onToggleVisibility={() => onToggleVisibility(block.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
