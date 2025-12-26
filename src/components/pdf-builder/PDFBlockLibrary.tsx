import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { BLOCK_DEFINITIONS, DocumentType, BlockDefinition } from "@/types/pdf-builder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Building2,
  User,
  Ship,
  Settings,
  List,
  ArrowUpCircle,
  Package,
  Wrench,
  DollarSign,
  PenTool,
  FileText,
  Type,
  Image,
  Minus,
} from "lucide-react";

const BLOCK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  header: Building2,
  buyer: User,
  boat: Ship,
  technical_panel: Settings,
  memorial: List,
  upgrades: ArrowUpCircle,
  options: Package,
  customizations: Wrench,
  financial_summary: DollarSign,
  signatures: PenTool,
  notes: FileText,
  text: Type,
  image: Image,
  page_break: Minus,
};

interface PDFBlockLibraryProps {
  documentType: DocumentType;
  existingBlockTypes: string[];
}

function DraggableBlock({ block, isDisabled }: { block: BlockDefinition; isDisabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${block.type}`,
    data: { block, fromLibrary: true },
    disabled: isDisabled,
  });

  const Icon = BLOCK_ICONS[block.type] || FileText;

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
        isDragging && "opacity-50 shadow-lg z-50",
        isDisabled
          ? "opacity-40 cursor-not-allowed bg-muted"
          : "cursor-grab hover:border-primary hover:bg-accent active:cursor-grabbing"
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{block.label}</p>
        {isDisabled && (
          <p className="text-xs text-muted-foreground">Já adicionado</p>
        )}
      </div>
    </div>
  );
}

export function PDFBlockLibrary({ documentType, existingBlockTypes }: PDFBlockLibraryProps) {
  const availableBlocks = BLOCK_DEFINITIONS.filter(
    (block) => block.availableFor.includes(documentType)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Biblioteca de Blocos</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Arraste para adicionar ao documento
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {availableBlocks.map((block) => {
            const isDisabled = existingBlockTypes.includes(block.type) && 
              !["text", "image", "page_break"].includes(block.type);
            
            return (
              <DraggableBlock
                key={block.type}
                block={block}
                isDisabled={isDisabled}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
