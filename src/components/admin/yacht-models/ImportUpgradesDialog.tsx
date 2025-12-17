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
  parseExcelFile, 
  validateUpgradesImportData,
  UpgradeImportRow,
  generateUpgradesTemplate,
  exportToExcel,
} from "@/lib/export-utils";
import { formatCurrency } from "@/lib/quotation-utils";
import { cn } from "@/lib/utils";

interface ImportUpgradesDialogProps {
  yachtModelId: string;
  memorialItems: any[];
}

type ImportMode = "replace" | "merge";

export function ImportUpgradesDialog({ yachtModelId, memorialItems }: ImportUpgradesDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [previewData, setPreviewData] = useState<UpgradeImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [pendingLinkCount, setPendingLinkCount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Calculate duplicates from current preview data
  const { duplicateCount, duplicateKeys } = useMemo(() => {
    const keyCount = new Map<string, number>();
    previewData.forEach(row => {
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

  const isDuplicateRow = (row: UpgradeImportRow) => {
    const key = row.code.toLowerCase();
    return duplicateKeys.has(key);
  };

  const removeDuplicates = () => {
    // Keep last occurrence of each duplicate
    const seen = new Map<string, UpgradeImportRow>();
    previewData.forEach(row => {
      const key = row.code.toLowerCase();
      seen.set(key, row);
    });
    setPreviewData(Array.from(seen.values()));
    toast.success(`${duplicateCount} duplicado(s) removido(s)`);
  };

  const importMutation = useMutation({
    mutationFn: async ({ rows, mode }: { rows: UpgradeImportRow[]; mode: ImportMode }) => {
      // If replace mode, delete existing upgrades
      if (mode === "replace") {
        const { error: deleteError } = await supabase
          .from("memorial_upgrades")
          .delete()
          .eq("yacht_model_id", yachtModelId);
        
        if (deleteError) throw deleteError;
      }

      // Create a map of memorial item name (lowercase) to id
      const itemMap = new Map<string, string>();
      memorialItems?.forEach(item => {
        itemMap.set(item.item_name.toLowerCase().trim(), item.id);
      });

      // Deduplicate with Map (last occurrence wins)
      const upgradesMap = new Map<string, any>();

      rows.forEach((row) => {
        const key = row.code.toLowerCase();
        
        // Tentar encontrar o memorial item se o nome foi fornecido
        const memorialItemId = row.memorial_item_name 
          ? itemMap.get(row.memorial_item_name.toLowerCase().trim()) || null
          : null;

        upgradesMap.set(key, {
          yacht_model_id: yachtModelId,
          memorial_item_id: memorialItemId,
          code: row.code,
          name: row.name,
          description: row.description || null,
          brand: row.brand || null,
          model: row.model || null,
          price: row.price,
          delivery_days_impact: row.delivery_days_impact || 0,
          is_active: row.is_active ?? true,
          is_customizable: row.is_customizable ?? true,
          is_configurable: row.is_configurable ?? false,
        });
      });

      const upgradesToInsert = Array.from(upgradesMap.values());

      const { error } = await supabase
        .from("memorial_upgrades")
        .insert(upgradesToInsert);

      if (error) throw error;
      
      return upgradesToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["memorial-upgrades", yachtModelId] });
      toast.success(`${count} upgrades importados com sucesso!`);
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
      const validation = validateUpgradesImportData(data);
      
      setValidationErrors(validation.errors);
      setPreviewData(validation.rows);
      setPendingLinkCount(validation.pendingLinkCount);
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
    setPendingLinkCount(0);
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
          <DialogTitle>Importar Upgrades</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx) ou CSV com os upgrades do modelo.
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
                  const template = generateUpgradesTemplate();
                  exportToExcel(template, "template_upgrades_exemplo", "Upgrades");
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Baixar Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="upgrades-file">Arquivo</Label>
            <div className="flex items-center gap-4">
              <Input
                id="upgrades-file"
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
                  <RadioGroupItem value="merge" id="upgrades-merge" />
                  <Label htmlFor="upgrades-merge" className="font-normal cursor-pointer">
                    Adicionar aos existentes (mantém upgrades atuais)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="upgrades-replace" />
                  <Label htmlFor="upgrades-replace" className="font-normal cursor-pointer text-destructive">
                    Substituir tudo (deleta upgrades existentes)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Duplicates Alert */}
          {duplicateCount > 0 && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-amber-800">
                  {duplicateCount} upgrade(s) duplicado(s) no arquivo (mesmo código)
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={removeDuplicates}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Remover {duplicateCount} Duplicados
                </Button>
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
                  {previewData.length} upgrades válidos para importação
                </span>
              </div>

              {pendingLinkCount > 0 && (
                <Alert className="mb-3 border-warning bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-sm">
                    <strong>{pendingLinkCount} upgrades</strong> não possuem vínculo com item do memorial. 
                    Eles serão importados como <strong>pendentes</strong> e não aparecerão no configurador até serem vinculados.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Item Vinculado</TableHead>
                      <TableHead className="text-right">Preço Delta</TableHead>
                      <TableHead className="text-right">Prazo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 20).map((row, i) => (
                      <TableRow key={i} className={cn(isDuplicateRow(row) && "bg-amber-50")}>
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
                          {row.memorial_item_name || (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <AlertTriangle className="h-3 w-3" />
                              Pendente
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right text-success">
                          +{formatCurrency(row.price)}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {row.delivery_days_impact ? `+${row.delivery_days_impact}d` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {previewData.length > 20 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          ... e mais {previewData.length - 20} upgrades
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
            disabled={previewData.length === 0 || importMutation.isPending || isValidating}
          >
            {importMutation.isPending ? "Importando..." : `Importar ${previewData.length} Upgrades`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
