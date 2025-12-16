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
  validateOptionsImportData,
  OptionImportRow 
} from "@/lib/export-utils";

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

      // Create a map of category name to category id
      const categoryMap = new Map<string, string>();
      categories?.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
      });

      // Transform rows to database format
      const optionsToInsert = rows.map((row) => {
        const categoryId = categoryMap.get(row.category.toLowerCase());
        
        if (!categoryId) {
          throw new Error(`Categoria "${row.category}" não encontrada. Verifique se a categoria existe no sistema.`);
        }

        return {
          yacht_model_id: yachtModelId,
          code: row.code,
          name: row.name,
          description: row.description || null,
          category_id: categoryId,
          base_price: row.base_price,
          delivery_days_impact: row.delivery_days_impact || 0,
          is_active: row.is_active ?? true,
        };
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
      const validation = validateOptionsImportData(data);
      
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
          <DialogTitle>Importar Opcionais</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx) ou CSV com os opcionais do modelo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
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
                  {previewData.length} opcionais válidos para importação
                </span>
              </div>
              
              <ScrollArea className="flex-1 border rounded-lg">
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
                      <TableRow key={i}>
                        <TableCell className="text-sm font-mono">{row.code}</TableCell>
                        <TableCell className="text-sm font-medium">{row.name}</TableCell>
                        <TableCell className="text-sm">{row.category}</TableCell>
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
            {importMutation.isPending ? "Importando..." : `Importar ${previewData.length} Opcionais`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
