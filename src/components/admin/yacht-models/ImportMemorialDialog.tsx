import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, AlertCircle, CheckCircle2, FileDown, Lightbulb, AlertTriangle } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [editableData, setEditableData] = useState<MemorialImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Calcular quantos itens têm erro de categoria
  const unmatchedCount = useMemo(() => {
    return editableData.filter(row => row._categoryError).length;
  }, [editableData]);

  // Função para atualizar categoria de uma linha
  const updateRowCategory = (index: number, newCategory: string) => {
    setEditableData(prev => {
      const updated = [...prev];
      updated[index] = { 
        ...updated[index], 
        categoria: newCategory,
        _categoryError: false, // Limpa o erro após correção
      };
      return updated;
    });
  };

  // Verificar se uma categoria existe
  const categoryExists = (categoria: string) => {
    return categories?.some(c => c.label.toLowerCase() === categoria.toLowerCase());
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

      // Transform rows to database format with deduplication (last occurrence wins)
      const itemsMap = new Map<string, any>();
      
      rows.forEach((row, index) => {
        const categoryData = categoryMap.get(row.categoria.toLowerCase());
        
        if (!categoryData) {
          throw new Error(`Categoria "${row.categoria}" não encontrada. Corrija antes de importar.`);
        }

        // Unique key: category + item_name (lowercase for consistency)
        const key = `${categoryData.value}|${row.item_name.toLowerCase()}`;
        
        // If already exists, overwrites (last occurrence wins)
        itemsMap.set(key, {
          yacht_model_id: yachtModelId,
          category_id: categoryData.id,
          category: categoryData.value as MemorialCategory,
          item_name: row.item_name,
          description: row.description || null,
          brand: row.brand || null,
          model: row.model || null,
          quantity: row.quantity || 1,
          unit: row.unit || "unidade",
          display_order: row.display_order || index + 1,
          is_customizable: row.is_customizable ?? true,
          is_configurable: row.is_configurable ?? false,
          is_active: row.is_active ?? true,
        });
      });
      
      const itemsToInsert = Array.from(itemsMap.values());

      const { error } = await supabase
        .from("memorial_items")
        .upsert(itemsToInsert, { 
          onConflict: 'yacht_model_id,category,item_name' 
        });

      if (error) throw error;
      
      return { itemsCount: itemsToInsert.length };
    },
    onSuccess: ({ itemsCount }) => {
      queryClient.invalidateQueries({ queryKey: ["memorial-items", yachtModelId] });
      toast.success(`${itemsCount} itens importados com sucesso!`);
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
    setEditableData([]);

    try {
      const data = await parseExcelFile<any>(selectedFile);
      // Passa as categorias existentes para validação
      const validation = validateMemorialImportData(data, categories);
      
      setValidationErrors(validation.errors);
      setEditableData(validation.rows);
    } catch (error) {
      toast.error("Erro ao processar arquivo: " + (error as Error).message);
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = () => {
    if (editableData.length === 0) {
      toast.error("Nenhum dado válido para importar");
      return;
    }

    if (unmatchedCount > 0) {
      toast.error("Corrija as categorias inválidas antes de importar");
      return;
    }
    
    importMutation.mutate({ rows: editableData, mode: importMode });
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setEditableData([]);
    setValidationErrors([]);
    setImportMode("merge");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Importar</TooltipContent>
      </Tooltip>
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
          {editableData.length > 0 && (
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

          {/* Unmatched Categories Warning */}
          {unmatchedCount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{unmatchedCount} {unmatchedCount === 1 ? 'item tem' : 'itens têm'} categoria não reconhecida.</strong>
                {' '}Corrija selecionando uma categoria existente na tabela abaixo.
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {editableData.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                {unmatchedCount === 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {editableData.length} itens válidos para importação
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-600">
                      {editableData.length} itens • {unmatchedCount} pendente{unmatchedCount > 1 ? 's' : ''} de correção
                    </span>
                  </>
                )}
              </div>
              
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Categoria</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="w-[60px]">Qtd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editableData.slice(0, 50).map((row, i) => (
                      <TableRow key={i} className={row._categoryError ? "bg-destructive/10" : ""}>
                        <TableCell className="text-sm">
                          {row._categoryError ? (
                            <Select
                              value=""
                              onValueChange={(value) => updateRowCategory(i, value)}
                            >
                              <SelectTrigger className="h-8 border-destructive text-destructive">
                                <SelectValue placeholder={row.categoria} />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map(cat => (
                                  <SelectItem key={cat.id} value={cat.label}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {row.categoria}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{row.item_name}</TableCell>
                        <TableCell className="text-sm">{row.brand || "-"}</TableCell>
                        <TableCell className="text-sm">{row.model || "-"}</TableCell>
                        <TableCell className="text-sm">{row.quantity || 1}</TableCell>
                      </TableRow>
                    ))}
                    {editableData.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          ... e mais {editableData.length - 50} itens
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={editableData.length === 0 || unmatchedCount > 0 || importMutation.isPending || isValidating}
          >
            {importMutation.isPending 
              ? "Importando..." 
              : unmatchedCount > 0 
                ? `Corrija ${unmatchedCount} categoria${unmatchedCount > 1 ? 's' : ''}` 
                : `Importar ${editableData.length} Itens`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
