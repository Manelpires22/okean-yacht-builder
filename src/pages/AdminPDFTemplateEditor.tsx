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
import { PDFBlock, BlockDefinition, BLOCK_DEFINITIONS, PDFStyle, PDFTemplateSettings } from "@/types/pdf-builder";
import { ArrowLeft, Save, Loader2, Eye, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AdminPDFTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: template, isLoading } = usePDFTemplate(id);
  const updateTemplate = useUpdatePDFTemplate();

  const [blocks, setBlocks] = useState<PDFBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [pdfStyle, setPdfStyle] = useState<PDFStyle>("clean");

  const debouncedBlocks = useDebounce(blocks, 1000);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Initialize blocks and settings from template
  useEffect(() => {
    if (template?.template_json?.blocks) {
      setBlocks(template.template_json.blocks);
    }
    if (template?.template_json?.settings?.style) {
      setPdfStyle(template.template_json.settings.style);
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
      const updatedSettings: PDFTemplateSettings = {
        ...template.template_json.settings,
        style: pdfStyle,
      };

      await updateTemplate.mutateAsync({
        id: template.id,
        template_json: {
          ...template.template_json,
          blocks,
          settings: updatedSettings,
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

  const handleStyleChange = (newStyle: PDFStyle) => {
    setPdfStyle(newStyle);
    setHasChanges(true);
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
            {/* Block Library + Style Selector */}
            <div className="col-span-3 border-r bg-background overflow-hidden flex flex-col">
              {/* Style Selector */}
              <div className="p-4 border-b">
                <Label className="text-xs font-medium text-muted-foreground uppercase mb-3 block">
                  Estilo do Documento
                </Label>
                <RadioGroup
                  value={pdfStyle}
                  onValueChange={(v) => handleStyleChange(v as PDFStyle)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div>
                    <RadioGroupItem
                      value="clean"
                      id="style-clean"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="style-clean"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <FileText className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">Clean</span>
                      <span className="text-[10px] text-muted-foreground">Apenas texto</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="premium"
                      id="style-premium"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="style-premium"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Sparkles className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">Premium</span>
                      <span className="text-[10px] text-muted-foreground">Visual completo</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Block Library */}
              <div className="flex-1 overflow-hidden">
                <PDFBlockLibrary
                  documentType={template.document_type}
                  existingBlockTypes={existingBlockTypes}
                />
              </div>
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
