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
import { Download, FileSpreadsheet, AlertCircle, CheckCircle2, FileDown, Lightbulb, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  parseExcelFile, 
  validateOptionsImportData,
  OptionImportRow,
  generateOptionsTemplate,
  exportToExcel,
} from "@/lib/export-utils";
import { cn } from "@/lib/utils";

interface ImportOptionsDialogProps {
  yachtModelId: string;
  categories: any[];
}

type ImportMode = "replace" | "merge";

export function ImportOptionsDialog({ yachtModelId, categories }: ImportOptionsDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [previewData, setPreviewData] = useState<OptionImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Calculate duplicates from current preview data (bank constraint: unique code per model)
  const { duplicateCount, duplicateKeys } = useMemo(() => {
    const keyCount = new Map<string, number>();
    previewData.forEach((row) => {
      const key = row.code.toLowerCase();
      keyCount.set(key, (keyCount.get(key) || 0) + 1);
    });

    const keys = new Set<string>();
    let count = 0;
    keyCount.forEach((c, key) => {
      if (c > 1) {
        keys.add(key);
        count += c - 1; // Count extra occurrences
      }
    });

    return { duplicateCount: count, duplicateKeys: keys };
  }, [previewData]);

  const isDuplicateRow = (row: OptionImportRow) => {
    const key = row.code.toLowerCase();
    return duplicateKeys.has(key);
  };

  const removeDuplicates = () => {
    // Keep last occurrence of each duplicate (by code)
    const seen = new Map<string, OptionImportRow>();
    previewData.forEach((row) => {
      const key = row.code.toLowerCase();
      seen.set(key, row);
    });
    const deduped = Array.from(seen.values());
    setPreviewData(deduped);
    toast.success(`${duplicateCount} duplicado(s) removido(s)`);
  };

  // Calculate unmatched categories count
  const unmatchedCount = useMemo(() => {
    return previewData.filter((row) => row._categoryError).length;
  }, [previewData]);

  // Update category for a specific row (inline editing)
  const updateRowCategory = (index: number, newCategory: string) => {
    setPreviewData(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        category: newCategory,
        _categoryError: false,
      };
      return updated;
    });
  };

  const importMutation = useMutation({
    mutationFn: async ({ rows, mode }: { rows: OptionImportRow[]; mode: ImportMode }) => {
      // If replace mode, delete existing model-specific options
      if (mode === "replace") {
        const { error: deleteError } = await supabase
          .from("options")
          .delete()
          .eq("yacht_model_id", yachtModelId);
        
        if (deleteError) throw deleteError;
      }

      // Create a map of category label to category id
      const categoryMap = new Map<string, string>();
      categories?.forEach(cat => {
        categoryMap.set(cat.label.toLowerCase(), cat.id);
      });

      // Group items by category first, with deduplication (last occurrence wins)
      // NOTE: DB enforces unique (yacht_model_id, code). So dedupe must be by code.
      const itemsByCategory = new Map<string, { row: OptionImportRow; categoryId: string }[]>();
      const seenCodes = new Set<string>();

      rows.forEach((row) => {
        const categoryId = categoryMap.get(row.category.toLowerCase());

        if (!categoryId) {
          throw new Error(
            `Categoria "${row.category}" não encontrada. Verifique se a categoria existe no sistema.`
          );
        }

        const categoryKey = row.category.toLowerCase();
        if (!itemsByCategory.has(categoryKey)) {
          itemsByCategory.set(categoryKey, []);
        }

        const codeKey = row.code.toLowerCase();

        // Remove previous occurrence across ALL categories (last occurrence wins)
        if (seenCodes.has(codeKey)) {
          itemsByCategory.forEach((items) => {
            const existingIndex = items.findIndex(
              (i) => i.row.code.toLowerCase() === codeKey
            );
            if (existingIndex > -1) {
              items.splice(existingIndex, 1);
            }
          });
        }
        seenCodes.add(codeKey);

        itemsByCategory.get(categoryKey)!.push({ row, categoryId });
      });

      // Second pass: assign display_order sequentially within each category
      const optionsToInsert: any[] = [];

      itemsByCategory.forEach((items) => {
        items.forEach((item, indexInCategory) => {
          const { row, categoryId } = item;
          
          optionsToInsert.push({
            yacht_model_id: yachtModelId,
            code: row.code,
            name: row.name,
            description: row.description || null,
            category_id: categoryId,
            base_price: row.base_price,
            delivery_days_impact: row.delivery_days_impact || 0,
            is_active: row.is_active ?? true,
          });
        });
      });

      const { error } = await supabase
        .from("options")
        .insert(optionsToInsert);

      if (error) throw error;
      
      return optionsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["yacht-model-options-v2", yachtModelId] });
      queryClient.invalidateQueries({ queryKey: ["options"] });
      toast.success(`${count} opcionais importados com sucesso!`);
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
      const validation = validateOptionsImportData(data, categories);
      
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
    
    if (unmatchedCount > 0) {
      toast.error("Corrija as categorias inválidas antes de importar");
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
          <DialogTitle>Importar Opcionais</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx) ou CSV com os opcionais do modelo.
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
                  const template = generateOptionsTemplate();
                  exportToExcel(template, "template_opcionais_exemplo", "Opcionais");
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Baixar Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="options-file">Arquivo</Label>
            <div className="flex items-center gap-4">
              <Input
                id="options-file"
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
                  <RadioGroupItem value="merge" id="options-merge" />
                  <Label htmlFor="options-merge" className="font-normal cursor-pointer">
                    Adicionar aos existentes (mantém opcionais atuais)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="options-replace" />
                  <Label htmlFor="options-replace" className="font-normal cursor-pointer text-destructive">
                    Substituir tudo (deleta opcionais específicos existentes)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Unmatched Categories Alert */}
          {unmatchedCount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{unmatchedCount} {unmatchedCount === 1 ? 'item tem' : 'itens têm'} categoria não reconhecida.</strong>
                {' '}Corrija selecionando uma categoria existente na tabela abaixo.
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicates Alert */}
          {duplicateCount > 0 && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-amber-800 font-medium">
                      {duplicateCount} item(ns) duplicado(s) no arquivo (mesmo código)
                    </span>
                    <div className="text-xs text-amber-700 mt-1">
                      Códigos: <code className="bg-amber-100 px-1 rounded">{Array.from(duplicateKeys).join(', ')}</code>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={removeDuplicates}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 ml-4"
                  >
                    Remover {duplicateCount} Duplicados
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && !validationErrors.every(e => e.includes('duplicado')) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Erros encontrados:</p>
                <ul className="list-disc list-inside text-sm max-h-24 overflow-y-auto">
                  {validationErrors.filter(e => !e.includes('duplicado')).slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {validationErrors.filter(e => !e.includes('duplicado')).length > 10 && (
                    <li>... e mais {validationErrors.filter(e => !e.includes('duplicado')).length - 10} erros</li>
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
                  {previewData.length} opcionais válidos para importação
                  {unmatchedCount > 0 && (
                    <span className="text-destructive ml-1">
                      ({unmatchedCount} com categoria inválida)
                    </span>
                  )}
                </span>
              </div>
              
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Prazo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 20).map((row, i) => (
                      <TableRow 
                        key={i} 
                        className={cn(
                          isDuplicateRow(row) && "bg-amber-50",
                          row._categoryError && "bg-destructive/10"
                        )}
                      >
                        <TableCell className="text-sm font-mono">
                          {row.code}
                          {isDuplicateRow(row) && (
                            <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">
                              Duplicado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{row.name}</TableCell>
                        <TableCell className="text-sm">
                          {row._categoryError ? (
                            <Select 
                              value="" 
                              onValueChange={(v) => updateRowCategory(i, v)}
                            >
                              <SelectTrigger className="h-8 w-[180px] border-destructive">
                                <SelectValue placeholder={row.category} />
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
                            row.category
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right">{formatCurrency(row.base_price)}</TableCell>
                        <TableCell className="text-sm text-right">
                          {row.delivery_days_impact ? `+${row.delivery_days_impact}d` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {previewData.length > 20 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          ... e mais {previewData.length - 20} opcionais
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
            disabled={previewData.length === 0 || importMutation.isPending || isValidating || unmatchedCount > 0}
          >
            {importMutation.isPending ? "Importando..." : `Importar ${previewData.length} Opcionais`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
