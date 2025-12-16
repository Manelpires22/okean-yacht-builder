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
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
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
  MemorialImportRow 
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

      // Transform rows to database format
      const itemsToInsert = rows.map((row, index) => {
        const categoryData = categoryMap.get(row.categoria.toLowerCase());
        
        if (!categoryData) {
          throw new Error(`Categoria "${row.categoria}" não encontrada. Verifique se a categoria existe no sistema.`);
        }

        return {
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
        };
      });

      const { error } = await supabase
        .from("memorial_items")
        .insert(itemsToInsert);

      if (error) throw error;
      
      return itemsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["memorial-items", yachtModelId] });
      toast.success(`${count} itens importados com sucesso!`);
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
                    {previewData.slice(0, 20).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{row.categoria}</TableCell>
                        <TableCell className="text-sm font-medium">{row.item_name}</TableCell>
                        <TableCell className="text-sm">{row.brand || "-"}</TableCell>
                        <TableCell className="text-sm">{row.model || "-"}</TableCell>
                        <TableCell className="text-sm">{row.quantity}</TableCell>
                      </TableRow>
                    ))}
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
