import { useState } from "react";
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
import { Upload, FileSpreadsheet, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  parseExcelFile, 
  validateCategoriesImportData, 
  exportToExcel,
  generateCategoriesTemplate,
  CategoryImportRow 
} from "@/lib/export-utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ImportCategoriesDialogProps {
  existingCategories: any[];
}

export function ImportCategoriesDialog({ existingCategories }: ImportCategoriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [validatedData, setValidatedData] = useState<CategoryImportRow[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidatedData(null);
    setValidationErrors([]);

    try {
      const data = await parseExcelFile<any>(selectedFile);
      const { valid, errors, rows } = validateCategoriesImportData(data);
      
      if (!valid) {
        setValidationErrors(errors);
        return;
      }

      // Check for duplicate values
      const values = rows.map(r => r.value);
      const duplicates = values.filter((v, i) => values.indexOf(v) !== i);
      if (duplicates.length > 0) {
        setValidationErrors([`Códigos duplicados no arquivo: ${[...new Set(duplicates)].join(', ')}`]);
        return;
      }

      setValidatedData(rows);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      console.error(error);
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCategoriesTemplate();
    exportToExcel(template, "template_categorias", "Categorias");
    toast.success("Template baixado!");
  };

  const handleImport = async () => {
    if (!validatedData || validatedData.length === 0) return;

    setIsLoading(true);

    try {
      // If replace mode, check for categories with linked items
      if (importMode === "replace") {
        const { data: itemCounts } = await supabase
          .from('memorial_items')
          .select('category_id')
          .in('category_id', existingCategories.map(c => c.id));

        if (itemCounts && itemCounts.length > 0) {
          toast.error("Não é possível substituir categorias que possuem itens vinculados");
          setIsLoading(false);
          return;
        }

        // Delete all existing categories
        const { error: deleteError } = await supabase
          .from('memorial_categories')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) throw deleteError;
      }

      // Process each row
      for (let i = 0; i < validatedData.length; i++) {
        const row = validatedData[i];
        
        // Check if category exists (by value/code)
        const existingCategory = existingCategories.find(c => c.value === row.value);

        const categoryData = {
          value: row.value,
          label: row.label,
          description: row.description || null,
          icon: row.icon || null,
          display_order: row.display_order ?? i + 1,
          is_active: row.is_active ?? true,
        };

        if (existingCategory && importMode === "merge") {
          // Update existing
          const { error } = await supabase
            .from('memorial_categories')
            .update(categoryData)
            .eq('id', existingCategory.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('memorial_categories')
            .insert(categoryData);

          if (error) throw error;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
      toast.success(`${validatedData.length} categorias importadas com sucesso!`);
      setOpen(false);
      resetState();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Erro ao importar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setValidatedData(null);
    setValidationErrors([]);
    setImportMode("merge");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Categorias</DialogTitle>
          <DialogDescription>
            Importe categorias de um arquivo Excel ou CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Baixe o template de exemplo</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="file">Arquivo Excel ou CSV</Label>
            <input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {validatedData && validatedData.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <Label>Preview ({validatedData.length} categorias)</Label>
                <Badge variant="secondary">{validatedData.length} linhas válidas</Badge>
              </div>
              
              <ScrollArea className="max-h-[400px] border rounded-md">
                <div className="p-3 space-y-2">
                  {validatedData.slice(0, 10).map((row, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{row.value}</Badge>
                        <span className="font-medium">{row.label}</span>
                      </div>
                      <Badge variant={row.is_active !== false ? "default" : "secondary"}>
                        {row.is_active !== false ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  ))}
                  {validatedData.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... e mais {validatedData.length - 10} categorias
                    </p>
                  )}
                </div>
              </ScrollArea>

              {/* Import Mode */}
              <div>
                <Label>Modo de importação</Label>
                <RadioGroup 
                  value={importMode} 
                  onValueChange={(v) => setImportMode(v as "merge" | "replace")}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge" className="font-normal cursor-pointer">
                      Mesclar (adicionar novas e atualizar existentes pelo código)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="font-normal cursor-pointer">
                      Substituir (deletar todas e importar novas)
                    </Label>
                  </div>
                </RadioGroup>
                {importMode === "replace" && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Categorias com itens vinculados não podem ser deletadas.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!validatedData || validatedData.length === 0 || isLoading}
          >
            {isLoading ? "Importando..." : `Importar ${validatedData?.length || 0} categorias`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
