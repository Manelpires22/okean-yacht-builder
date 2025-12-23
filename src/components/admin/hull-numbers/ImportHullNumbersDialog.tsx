import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { format, parse } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useImportHullNumbers } from "@/hooks/useHullNumbers";
import { useYachtModels } from "@/hooks/useYachtModels";
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

interface ImportRow {
  brand: string;
  model: string;
  hull_number: string;
  hull_entry_date: string;
  estimated_delivery_date: string;
  yacht_model_id?: string;
  error?: string;
}

interface ImportHullNumbersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportHullNumbersDialog({ open, onOpenChange }: ImportHullNumbersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  
  const { data: yachtModels } = useYachtModels();
  const importMutation = useImportHullNumbers();

  const parseDate = (value: any): string | null => {
    if (!value) return null;
    
    // Se for número (Excel date serial)
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    // Se for string
    if (typeof value === 'string') {
      // Tentar formatos comuns
      const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
      for (const fmt of formats) {
        try {
          const parsed = parse(value, fmt, new Date());
          if (!isNaN(parsed.getTime())) {
            return format(parsed, 'yyyy-MM-dd');
          }
        } catch {}
      }
    }
    
    return null;
  };

  const findModelId = useCallback((modelText: string): string | null => {
    if (!yachtModels || !modelText) return null;
    
    const normalized = modelText.toUpperCase().replace(/\s+/g, '');
    
    // Buscar por código exato
    const byCode = yachtModels.find(m => 
      m.code.toUpperCase().replace(/\s+/g, '') === normalized
    );
    if (byCode) return byCode.id;
    
    // Buscar por nome contendo
    const byName = yachtModels.find(m => 
      m.name.toUpperCase().includes(normalized) || 
      normalized.includes(m.name.toUpperCase())
    );
    if (byName) return byName.id;
    
    return null;
  }, [yachtModels]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setParsing(true);
    
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      // Pular header e processar linhas
      const parsedRows: ImportRow[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 5) continue;
        
        const brand = String(row[0] || 'OKEAN').trim();
        const model = String(row[1] || '').trim();
        const hull_number = String(row[2] || '').trim().padStart(2, '0').slice(-2);
        const hull_entry_date = parseDate(row[3]);
        const estimated_delivery_date = parseDate(row[4]);
        
        const yacht_model_id = findModelId(model);
        
        let error: string | undefined;
        if (!model) error = 'Modelo não informado';
        else if (!yacht_model_id) error = `Modelo "${model}" não encontrado`;
        else if (!hull_number) error = 'Matrícula não informada';
        else if (!hull_entry_date) error = 'Data de entrada inválida';
        else if (!estimated_delivery_date) error = 'Data de entrega inválida';
        
        parsedRows.push({
          brand,
          model,
          hull_number,
          hull_entry_date: hull_entry_date || '',
          estimated_delivery_date: estimated_delivery_date || '',
          yacht_model_id: yacht_model_id || undefined,
          error,
        });
      }
      
      setRows(parsedRows);
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
    } finally {
      setParsing(false);
    }
  };

  const validRows = rows.filter(r => !r.error);
  const invalidRows = rows.filter(r => r.error);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    
    await importMutation.mutateAsync(
      validRows.map(r => ({
        brand: r.brand,
        yacht_model_id: r.yacht_model_id!,
        hull_number: r.hull_number,
        hull_entry_date: r.hull_entry_date,
        estimated_delivery_date: r.estimated_delivery_date,
      }))
    );
    
    onOpenChange(false);
    setFile(null);
    setRows([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setRows([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Matrículas
          </DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha Excel com as matrículas. 
            Colunas: Marca | Modelo | Matrícula | Data Entrada Casco | Data Entrega Prevista
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo Excel (.xlsx, .xls)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={parsing}
            />
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-4">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validRows.length} válidas
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {invalidRows.length} com erro
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Entrega</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} className={row.error ? "bg-destructive/10" : ""}>
                        <TableCell>
                          {row.error ? (
                            <span className="text-destructive text-xs">{row.error}</span>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </TableCell>
                        <TableCell>{row.brand}</TableCell>
                        <TableCell>{row.model}</TableCell>
                        <TableCell className="font-mono">{row.hull_number}</TableCell>
                        <TableCell>{row.hull_entry_date}</TableCell>
                        <TableCell>{row.estimated_delivery_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}

          {invalidRows.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {invalidRows.length} linha(s) com erro serão ignoradas na importação.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={validRows.length === 0 || importMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar {validRows.length} Matrículas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
