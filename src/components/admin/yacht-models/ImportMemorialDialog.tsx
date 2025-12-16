import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, FileDown, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  parseExcelFile, 
  validateMemorialImportData,
  MemorialImportRow,
  generateMemorialTemplate,
  exportToExcel,
} from "@/lib/export-utils";
import { Database } from "@/integrations/supabase/types";

type MemorialCategory = Database["public"]["Enums"]["memorial_category"];

interface ImportMemorialDialogProps {
  yachtModelId: string;
  categories: any[];
}

type ImportMode = "replace" | "merge";

export function ImportMemorialDialog({ yachtModelId, categories }: ImportMemorialDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [previewData, setPreviewData] = useState<MemorialImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Helper function to generate slug from category label
  const generateCategorySlug = (label: string): string => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const importMutation = useMutation({
    mutationFn: async ({ rows, mode }: { rows: MemorialImportRow[]; mode: ImportMode }) => {
      // If replace mode, delete existing items first
      if (mode === "replace") {
        const { error: deleteError } = await supabase
          .from("memorial_items")
          .delete()
          .eq("yacht_model_id", yachtModelId);
        
        if (deleteError) throw deleteError;
      }

      // Create a map of category label to category data
      const categoryMap = new Map<string, { id: string; value: string }>();
      categories?.forEach(cat => {
        categoryMap.set(cat.label.toLowerCase(), { id: cat.id, value: cat.value });
      });

      // Calculate max display_order for new categories
      const maxCategoryOrder = categories?.reduce((max, cat) => Math.max(max, cat.display_order || 0), 0) || 0;
      let newCategoryOrder = maxCategoryOrder;
      let categoriesCreated = 0;

      // Collect unique categories that need to be created
      const categoriesToCreate = new Map<string, string>();
      for (const row of rows) {
        const categoryKey = row.categoria.toLowerCase();
        if (!categoryMap.has(categoryKey) && !categoriesToCreate.has(categoryKey)) {
          categoriesToCreate.set(categoryKey, row.categoria);
        }
      }

      // Create missing categories
      for (const [key, label] of categoriesToCreate) {
        newCategoryOrder++;
        const slug = generateCategorySlug(label);
        
        const { data: newCategory, error: createError } = await supabase
          .from("memorial_categories")
          .insert({
            value: slug,
            label: label,
            display_order: newCategoryOrder,
            is_active: true,
          })
          .select("id, value")
          .single();

        if (createError) {
          throw new Error(`Erro ao criar categoria "${label}": ${createError.message}`);
        }

        categoryMap.set(key, { id: newCategory.id, value: newCategory.value });
        categoriesCreated++;
      }

      // Transform rows to database format with defaults
      const itemsToInsert = rows.map((row, index) => {
        const categoryData = categoryMap.get(row.categoria.toLowerCase());
        
        // This should never happen now, but keep as safety check
        if (!categoryData) {
          throw new Error(`Categoria "${row.categoria}" não encontrada.`);
        }

        return {
          yacht_model_id: yachtModelId,
          category_id: categoryData.id,
          category: categoryData.value as MemorialCategory,
          item_name: row.item_name,
          // Defaults for empty fields
          description: row.description || null,
          brand: row.brand || null,
          model: row.model || null,
          quantity: row.quantity || 1,
          unit: row.unit || "unidade",
          display_order: row.display_order || index + 1,
          is_customizable: row.is_customizable ?? true,
          is_configurable: row.is_configurable ?? false,
          is_active: row.is_active ?? true,
        };
      });

      const { error } = await supabase
        .from("memorial_items")
        .insert(itemsToInsert);

      if (error) throw error;
      
      return { itemsCount: itemsToInsert.length, categoriesCreated };
    },
    onSuccess: ({ itemsCount, categoriesCreated }) => {
      queryClient.invalidateQueries({ queryKey: ["memorial-items", yachtModelId] });
      queryClient.invalidateQueries({ queryKey: ["memorial-categories"] });
      
      const categoryMsg = categoriesCreated > 0 
        ? ` (${categoriesCreated} nova${categoriesCreated > 1 ? 's' : ''} categoria${categoriesCreated > 1 ? 's' : ''} criada${categoriesCreated > 1 ? 's' : ''})`
        : '';
      toast.success(`${itemsCount} itens importados com sucesso!${categoryMsg}`);
      handleClose();
    },
    onError: (error: Error) => {
      toast.error("Erro ao importar: " + error.message);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Formato inválido. Use arquivos .xlsx, .xls ou .csv");
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);
    setValidationErrors([]);
    setPreviewData([]);

    try {
      const data = await parseExcelFile<any>(selectedFile);
      const validation = validateMemorialImportData(data);
      
      setValidationErrors(validation.errors);
      setPreviewData(validation.rows);
    } catch (error) {
      toast.error("Erro ao processar arquivo: " + (error as Error).message);
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = () => {
    if (previewData.length === 0) {
      toast.error("Nenhum dado válido para importar");
      return;
    }
    
    importMutation.mutate({ rows: previewData, mode: importMode });
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setPreviewData([]);
    setValidationErrors([]);
    setImportMode("merge");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Memorial Descritivo</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx) ou CSV com os itens do memorial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Template Download */}
          <Alert className="bg-muted/50">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">
                Não sabe o formato esperado? Baixe o template com exemplos.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const template = generateMemorialTemplate();
                  exportToExcel(template, "template_memorial_exemplo", "Memorial");
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Baixar Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Import Mode */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <Label>Modo de Importação</Label>
              <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge" />
                  <Label htmlFor="merge" className="font-normal cursor-pointer">
                    Adicionar aos existentes (mantém itens atuais)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="font-normal cursor-pointer text-destructive">
                    Substituir tudo (deleta itens existentes)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Erros encontrados:</p>
                <ul className="list-disc list-inside text-sm max-h-24 overflow-y-auto">
                  {validationErrors.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li>... e mais {validationErrors.length - 10} erros</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  {previewData.length} itens válidos para importação
                </span>
              </div>

              {/* New categories warning */}
              {(() => {
                const existingLabels = new Set(categories?.map(c => c.label.toLowerCase()) || []);
                const newCategories = [...new Set(
                  previewData
                    .map(r => r.categoria)
                    .filter(cat => !existingLabels.has(cat.toLowerCase()))
                )];
                
                if (newCategories.length > 0) {
                  return (
                    <Alert className="mb-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        <span className="font-medium">{newCategories.length} nova{newCategories.length > 1 ? 's' : ''} categoria{newCategories.length > 1 ? 's' : ''} ser{newCategories.length > 1 ? 'ão' : 'á'} criada{newCategories.length > 1 ? 's' : ''}:</span>
                        <span className="ml-1">{newCategories.slice(0, 5).join(", ")}{newCategories.length > 5 ? ` e mais ${newCategories.length - 5}` : ''}</span>
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}
              
              <ScrollArea className="flex-1 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Qtd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 20).map((row, i) => {
                      const isNewCategory = !categories?.some(c => c.label.toLowerCase() === row.categoria.toLowerCase());
                      return (
                        <TableRow key={i}>
                          <TableCell className="text-sm">
                            {row.categoria}
                            {isNewCategory && (
                              <span className="ml-1 text-xs text-blue-600 font-medium">(nova)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{row.item_name}</TableCell>
                          <TableCell className="text-sm">{row.brand || "-"}</TableCell>
                          <TableCell className="text-sm">{row.model || "-"}</TableCell>
                          <TableCell className="text-sm">{row.quantity || 1}</TableCell>
                        </TableRow>
                      );
                    })}
                    {previewData.length > 20 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          ... e mais {previewData.length - 20} itens
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={previewData.length === 0 || importMutation.isPending || isValidating}
          >
            {importMutation.isPending ? "Importando..." : `Importar ${previewData.length} Itens`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
