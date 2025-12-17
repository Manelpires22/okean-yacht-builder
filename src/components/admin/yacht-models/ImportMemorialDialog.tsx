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
  const [duplicateKeys, setDuplicateKeys] = useState<Set<string>>(new Set());

  // Calcular quantos itens têm erro de categoria
  const unmatchedCount = useMemo(() => {
    return editableData.filter(row => row._categoryError).length;
  }, [editableData]);

  // Calcular quantos itens são duplicados
  const duplicateCount = useMemo(() => {
    let count = 0;
    const seen = new Set<string>();
    editableData.forEach(row => {
      const key = `${row.categoria.toLowerCase()}|${row.item_name.toLowerCase()}`;
      if (seen.has(key)) {
        count++;
      } else {
        seen.add(key);
      }
    });
    return count;
  }, [editableData]);

  // Verificar se uma linha é duplicada (não é a primeira ocorrência)
  const isDuplicateRow = (index: number) => {
    const row = editableData[index];
    const key = `${row.categoria.toLowerCase()}|${row.item_name.toLowerCase()}`;
    // Verificar se existe uma linha anterior com a mesma chave
    for (let i = 0; i < index; i++) {
      const prevRow = editableData[i];
      const prevKey = `${prevRow.categoria.toLowerCase()}|${prevRow.item_name.toLowerCase()}`;
      if (prevKey === key) return true;
    }
    return false;
  };

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

  // Função para remover duplicados (mantém última ocorrência)
  const removeDuplicates = () => {
    const itemsMap = new Map<string, { row: MemorialImportRow; index: number }>();
    
    // Percorrer do início ao fim para que a última ocorrência sobrescreva
    editableData.forEach((row, index) => {
      const key = `${row.categoria.toLowerCase()}|${row.item_name.toLowerCase()}`;
      itemsMap.set(key, { row, index });
    });
    
    // Extrair apenas as linhas únicas (mantendo ordem original da última ocorrência)
    const uniqueRows = Array.from(itemsMap.values())
      .sort((a, b) => a.index - b.index)
      .map(item => item.row);
    
    const removedCount = editableData.length - uniqueRows.length;
    setEditableData(uniqueRows);
    setDuplicateKeys(new Set());
    
    // Remover erro de duplicatas da lista de validação
    setValidationErrors(prev => prev.filter(err => !err.includes('itens duplicados')));
    
    toast.success(`${removedCount} duplicado${removedCount > 1 ? 's' : ''} removido${removedCount > 1 ? 's' : ''}`);
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

      // Group items by category first, with deduplication (last occurrence wins)
      const itemsByCategory = new Map<string, { row: MemorialImportRow; categoryData: { id: string; value: string } }[]>();
      const seenKeys = new Set<string>();
      
      // First pass: group by category and deduplicate
      rows.forEach((row) => {
        const categoryData = categoryMap.get(row.categoria.toLowerCase());
        
        if (!categoryData) {
          throw new Error(`Categoria "${row.categoria}" não encontrada. Corrija antes de importar.`);
        }

        const categoryKey = categoryData.value;
        if (!itemsByCategory.has(categoryKey)) {
          itemsByCategory.set(categoryKey, []);
        }
        
        // Unique key for deduplication
        const uniqueKey = `${categoryData.value}|${row.item_name.toLowerCase()}`;
        
        // Remove previous occurrence if exists (last occurrence wins)
        if (seenKeys.has(uniqueKey)) {
          const items = itemsByCategory.get(categoryKey)!;
          const existingIndex = items.findIndex(
            i => `${i.categoryData.value}|${i.row.item_name.toLowerCase()}` === uniqueKey
          );
          if (existingIndex > -1) {
            items.splice(existingIndex, 1);
          }
        }
        seenKeys.add(uniqueKey);
        
        itemsByCategory.get(categoryKey)!.push({ row, categoryData });
      });

      // Second pass: assign display_order sequentially within each category
      const itemsToInsert: any[] = [];
      
      itemsByCategory.forEach((items) => {
        items.forEach((item, indexInCategory) => {
          const { row, categoryData } = item;
          
          itemsToInsert.push({
            yacht_model_id: yachtModelId,
            category_id: categoryData.id,
            category: categoryData.value as MemorialCategory,
            item_name: row.item_name,
            description: row.description || null,
            brand: row.brand || null,
            model: row.model || null,
            quantity: row.quantity || 1,
            unit: row.unit || "unidade",
            display_order: indexInCategory + 1, // Sequential within category
            is_customizable: row.is_customizable ?? true,
            is_configurable: row.is_configurable ?? false,
            is_active: row.is_active ?? true,
          });
        });
      });

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
      setDuplicateKeys(validation.duplicateKeys);
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
    setDuplicateKeys(new Set());
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

          {/* Duplicate Items Warning with Remove Option */}
          {duplicateCount > 0 && (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-amber-800 dark:text-amber-200">
                  <strong>{duplicateCount} {duplicateCount === 1 ? 'item duplicado' : 'itens duplicados'}</strong> no arquivo. 
                  Você pode remover os duplicados ou manter (última ocorrência prevalece).
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeDuplicates}
                  className="ml-4 shrink-0 border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
                >
                  Remover {duplicateCount} Duplicado{duplicateCount > 1 ? 's' : ''}
                </Button>
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
                    {editableData.slice(0, 50).map((row, i) => {
                      const isDuplicate = isDuplicateRow(i);
                      return (
                        <TableRow 
                          key={i} 
                          className={
                            row._categoryError 
                              ? "bg-destructive/10" 
                              : isDuplicate 
                                ? "bg-amber-50 dark:bg-amber-950/20" 
                                : ""
                          }
                        >
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
                          <TableCell className="text-sm font-medium">
                            <span className="flex items-center gap-2">
                              {row.item_name}
                              {isDuplicate && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                                      <AlertTriangle className="h-3 w-3" />
                                      Duplicado
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Este item já aparece antes no arquivo. Será atualizado ou pode ser removido.
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{row.brand || "-"}</TableCell>
                          <TableCell className="text-sm">{row.model || "-"}</TableCell>
                          <TableCell className="text-sm">{row.quantity || 1}</TableCell>
                        </TableRow>
                      );
                    })}
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
