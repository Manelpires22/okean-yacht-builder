import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { PDFBlockLibrary } from "@/components/pdf-builder/PDFBlockLibrary";
import { PDFBlockCanvas } from "@/components/pdf-builder/PDFBlockCanvas";
import { PDFBlockConfig } from "@/components/pdf-builder/PDFBlockConfig";
import {
  usePDFTemplate,
  useUpdatePDFTemplate,
} from "@/hooks/usePDFTemplates";
import { PDFBlock, BlockDefinition, BLOCK_DEFINITIONS } from "@/types/pdf-builder";
import { ArrowLeft, Save, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";

export default function AdminPDFTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: template, isLoading } = usePDFTemplate(id);
  const updateTemplate = useUpdatePDFTemplate();

  const [blocks, setBlocks] = useState<PDFBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const debouncedBlocks = useDebounce(blocks, 1000);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Initialize blocks from template
  useEffect(() => {
    if (template?.template_json?.blocks) {
      setBlocks(template.template_json.blocks);
    }
  }, [template]);

  // Auto-save on changes
  useEffect(() => {
    if (hasChanges && template && debouncedBlocks.length >= 0) {
      handleSave(true);
    }
  }, [debouncedBlocks]);

  const handleSave = async (silent = false) => {
    if (!template) return;

    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        template_json: {
          ...template.template_json,
          blocks,
        },
      });
      setHasChanges(false);
      if (!silent) {
        toast.success("Template salvo com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao salvar template");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Adding new block from library
    if (String(active.id).startsWith("library-")) {
      const blockData = active.data.current?.block as BlockDefinition;
      if (blockData) {
        const newBlock: PDFBlock = {
          id: `${blockData.type}-${Date.now()}`,
          type: blockData.type,
          label: blockData.label,
          order: blocks.length,
          visible: true,
          config: { ...blockData.defaultConfig },
        };

        setBlocks((prev) => [...prev, newBlock]);
        setHasChanges(true);
        setSelectedBlockId(newBlock.id);
        toast.success(`Bloco "${blockData.label}" adicionado`);
      }
      return;
    }

    // Reordering existing blocks
    if (active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          setHasChanges(true);
          return arrayMove(items, oldIndex, newIndex).map((block, index) => ({
            ...block,
            order: index,
          }));
        }
        return items;
      });
    }
  };

  const handleRemoveBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setHasChanges(true);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    toast.success("Bloco removido");
  }, [selectedBlockId]);

  const handleToggleVisibility = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, visible: !b.visible } : b
      )
    );
    setHasChanges(true);
  }, []);

  const handleUpdateConfig = useCallback(
    (blockId: string, config: Record<string, unknown>) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, config } : b))
      );
      setHasChanges(true);
    },
    []
  );

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;
  const existingBlockTypes = blocks.map((b) => b.type);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            <Skeleton className="col-span-3 h-full" />
            <Skeleton className="col-span-6 h-full" />
            <Skeleton className="col-span-3 h-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!template) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p>Template não encontrado</p>
          <Button onClick={() => navigate("/admin/pdf-templates")} className="mt-4">
            Voltar
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col h-[calc(100vh-64px)]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/pdf-templates")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold">{template.name}</h1>
                <p className="text-xs text-muted-foreground">
                  v{template.version} • {hasChanges ? "Não salvo" : "Salvo"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(false)}
                disabled={updateTemplate.isPending || !hasChanges}
              >
                {updateTemplate.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
            {/* Block Library */}
            <div className="col-span-3 border-r bg-background overflow-hidden">
              <PDFBlockLibrary
                documentType={template.document_type}
                existingBlockTypes={existingBlockTypes}
              />
            </div>

            {/* Canvas */}
            <div className="col-span-6 overflow-hidden p-4">
              <PDFBlockCanvas
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onRemoveBlock={handleRemoveBlock}
                onToggleVisibility={handleToggleVisibility}
              />
            </div>

            {/* Config Panel */}
            <div className="col-span-3 border-l bg-background overflow-hidden">
              <PDFBlockConfig
                block={selectedBlock}
                onUpdateConfig={handleUpdateConfig}
              />
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && activeId.startsWith("library-") && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card shadow-lg opacity-80">
              <div className="w-8 h-8 rounded-md bg-primary/10" />
              <span className="text-sm font-medium">
                {BLOCK_DEFINITIONS.find(
                  (b) => `library-${b.type}` === activeId
                )?.label || "Bloco"}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </AdminLayout>
  );
}
