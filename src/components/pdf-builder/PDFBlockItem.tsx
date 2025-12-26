import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PDFBlock } from "@/types/pdf-builder";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  GripVertical,
  Trash2,
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

interface PDFBlockItemProps {
  block: PDFBlock;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
}

export function PDFBlockItem({
  block,
  isSelected,
  onSelect,
  onRemove,
  onToggleVisibility,
}: PDFBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = BLOCK_ICONS[block.type] || FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
        isDragging && "opacity-50 shadow-lg z-50",
        isSelected && "ring-2 ring-primary border-primary",
        !block.visible && "opacity-50"
      )}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{block.label}</p>
        <p className="text-xs text-muted-foreground">
          {block.visible ? "Visível" : "Oculto"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={block.visible}
          onCheckedChange={onToggleVisibility}
          onClick={(e) => e.stopPropagation()}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
