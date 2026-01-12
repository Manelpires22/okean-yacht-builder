import { useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useYachtModels } from "@/hooks/useYachtModels";
import { useUpsertHullNumbers, HullNumberInsert } from "@/hooks/useHullNumbers";
import { format } from "date-fns";
import { 
  FileSpreadsheet, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Ship,
  Calendar,
  Wrench,
  TestTube,
  Truck
} from "lucide-react";

interface ImportMasterPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ColumnMapping {
  key: keyof HullNumberInsert | 'model';
  label: string;
  excelColumn: string;
  category: 'basic' | 'jobstops' | 'production' | 'tests';
  required?: boolean;
}

// Mapeamento das colunas do Excel para os campos do banco
const COLUMN_MAPPINGS: ColumnMapping[] = [
  { key: 'brand', label: 'Marca', excelColumn: 'D', category: 'basic', required: true },
  { key: 'model', label: 'Modelo', excelColumn: 'E', category: 'basic', required: true },
  { key: 'hull_number', label: 'Matrícula', excelColumn: 'G', category: 'basic', required: true },
  { key: 'job_stop_1_date', label: 'Job Stop 1', excelColumn: 'M', category: 'jobstops' },
  { key: 'job_stop_2_date', label: 'Job Stop 2', excelColumn: 'O', category: 'jobstops' },
  { key: 'job_stop_3_date', label: 'Job Stop 3', excelColumn: 'Q', category: 'jobstops' },
  { key: 'job_stop_4_date', label: 'Job Stop 4', excelColumn: 'S', category: 'jobstops' },
  { key: 'hull_entry_date', label: 'Ingresso Casco', excelColumn: 'AM', category: 'production', required: true },
  { key: 'barco_aberto_date', label: 'Barco Aberto', excelColumn: 'AN', category: 'production' },
  { key: 'fechamento_convesdeck_date', label: 'Fechamento Convés', excelColumn: 'AO', category: 'production' },
  { key: 'barco_fechado_date', label: 'Barco Fechado', excelColumn: 'AP', category: 'production' },
  { key: 'teste_piscina_date', label: 'Teste Piscina', excelColumn: 'AS', category: 'tests' },
  { key: 'teste_mar_date', label: 'Teste Mar', excelColumn: 'AT', category: 'tests' },
  { key: 'entrega_comercial_date', label: 'Entrega Comercial', excelColumn: 'AV', category: 'tests' },
];

// Mapeamento de modelos da planilha para códigos do sistema
const MODEL_MAPPING: Record<string, string> = {
  '550': 'FY550',
  'FY 550': 'FY550',
  'FY550': 'FY550',
  '670': 'FY670',
  'FY 670': 'FY670',
  'FY670': 'FY670',
  '850': 'FY850',
  'FY 850': 'FY850',
  'FY850': 'FY850',
  '52': 'OKEAN52',
  'OKEAN 52': 'OKEAN52',
  'OKEAN52': 'OKEAN52',
  '57': 'OKEAN57',
  'OKEAN 57': 'OKEAN57',
  'OKEAN57': 'OKEAN57',
  '80': 'OKEAN80',
  'OKEAN 80': 'OKEAN80',
  'OKEAN80': 'OKEAN80',
};

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string | null>;
  yachtModelId: string | null;
  status: 'available' | 'contracted';
  error?: string;
}

export function ImportMasterPlanDialog({ open, onOpenChange }: ImportMasterPlanDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(COLUMN_MAPPINGS.filter(c => c.required).map(c => c.key))
  );
  const [isParsing, setIsParsing] = useState(false);
  const [step, setStep] = useState<'upload' | 'columns' | 'preview'>('upload');
  const [headerRow, setHeaderRow] = useState(12); // Linha do header no Excel (padrão: 12)

  const { data: yachtModels } = useYachtModels();
  const upsertMutation = useUpsertHullNumbers();

  // Helper para converter número de coluna para letra do Excel
  const columnIndexToLetter = (index: number): string => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  // Helper para converter letra do Excel para índice de coluna
  const letterToColumnIndex = (letter: string): number => {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 64);
    }
    return index - 1;
  };

  // Helper para parsear datas do Excel
  const parseExcelDate = useCallback((value: unknown): string | null => {
    if (!value) return null;

    // Se for número (serial date do Excel)
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    }

    // Se for string
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === '-' || trimmed === 'N/A') return null;

      // Tentar parsear diferentes formatos
      const formats = [
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // dd/mm/yyyy
        /^(\d{4})-(\d{2})-(\d{2})$/,   // yyyy-mm-dd
      ];

      for (const regex of formats) {
        const match = trimmed.match(regex);
        if (match) {
          if (regex === formats[0]) {
            return `${match[3]}-${match[2]}-${match[1]}`;
          }
          return trimmed;
        }
      }
    }

    return null;
  }, []);

  // Encontrar modelo pelo nome
  const findModelId = useCallback((modelName: string | null, brand: string | null): string | null => {
    if (!modelName || !yachtModels) return null;

    const normalizedModel = String(modelName).trim().toUpperCase();
    const normalizedBrand = String(brand || '').trim().toUpperCase();

    // Primeiro, tentar o mapeamento direto
    const mappedCode = MODEL_MAPPING[normalizedModel] || MODEL_MAPPING[modelName];
    if (mappedCode) {
      const model = yachtModels.find(m => m.code?.toUpperCase() === mappedCode);
      if (model) return model.id;
    }

    // Tentar combinar marca + modelo
    if (normalizedBrand) {
      const combinedCode = `${normalizedBrand}${normalizedModel}`.replace(/\s+/g, '');
      const model = yachtModels.find(m => 
        m.code?.toUpperCase().replace(/\s+/g, '') === combinedCode
      );
      if (model) return model.id;
    }

    // Tentar busca por nome parcial
    const model = yachtModels.find(m => 
      m.name?.toUpperCase().includes(normalizedModel) ||
      m.code?.toUpperCase().includes(normalizedModel)
    );

    return model?.id || null;
  }, [yachtModels]);

  // Parsear status da coluna AA (Cliente)
  const parseStatus = (value: unknown): 'available' | 'contracted' => {
    const str = String(value || '').trim().toLowerCase();
    if (str === 'tbd' || str === 'a definir' || str === '' || str === '-') {
      return 'available';
    }
    return 'contracted';
  };

  // Handler para arquivo selecionado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStep('columns');
  };

  // Parsear o arquivo com as colunas selecionadas
  const parseFile = useCallback(async () => {
    if (!file) return;

    setIsParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Converter para JSON com headers
      const jsonData = XLSX.utils.sheet_to_json(sheet, { 
        header: 1,
        defval: null,
      }) as unknown[][];

      const rows: ParsedRow[] = [];
      
      // Processar cada linha após o header
      for (let i = headerRow; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const rowData: Record<string, string | null> = {};
        
        // Extrair dados de cada coluna mapeada
        for (const mapping of COLUMN_MAPPINGS) {
          if (!selectedColumns.has(mapping.key)) continue;
          
          const colIndex = letterToColumnIndex(mapping.excelColumn);
          const value = row[colIndex];
          
          if (mapping.key === 'hull_number' || mapping.key === 'brand' || mapping.key === 'model') {
            rowData[mapping.key] = value ? String(value).trim() : null;
          } else {
            // É uma data
            rowData[mapping.key] = parseExcelDate(value);
          }
        }

        // Ler status da coluna AA
        const statusColIndex = letterToColumnIndex('AA');
        const statusValue = row[statusColIndex];
        const status = parseStatus(statusValue);

        // Validar dados obrigatórios
        const hullNumber = rowData['hull_number'];
        if (!hullNumber) continue; // Pular linhas sem matrícula

        // Encontrar modelo
        const yachtModelId = findModelId(rowData['model'], rowData['brand']);
        
        rows.push({
          rowNumber: i + 1,
          data: rowData,
          yachtModelId,
          status,
          error: !yachtModelId ? `Modelo "${rowData['model']}" não encontrado` : undefined,
        });
      }

      setParsedRows(rows);
      setStep('preview');
    } catch (error) {
      console.error('Erro ao parsear arquivo:', error);
    } finally {
      setIsParsing(false);
    }
  }, [file, headerRow, selectedColumns, findModelId, parseExcelDate]);

  // Toggle seleção de coluna
  const toggleColumn = (key: string) => {
    const mapping = COLUMN_MAPPINGS.find(c => c.key === key);
    if (mapping?.required) return; // Não permitir desmarcar obrigatórias

    setSelectedColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Importar dados
  const handleImport = async () => {
    const validRows = parsedRows.filter(r => !r.error && r.yachtModelId);
    
    const items: HullNumberInsert[] = validRows.map(row => ({
      brand: row.data['brand'] || 'OKEAN',
      yacht_model_id: row.yachtModelId!,
      hull_number: row.data['hull_number']!,
      hull_entry_date: row.data['hull_entry_date'] || format(new Date(), 'yyyy-MM-dd'),
      estimated_delivery_date: row.data['entrega_comercial_date'] || row.data['hull_entry_date'] || format(new Date(), 'yyyy-MM-dd'),
      status: row.status,
      job_stop_1_date: row.data['job_stop_1_date'],
      job_stop_2_date: row.data['job_stop_2_date'],
      job_stop_3_date: row.data['job_stop_3_date'],
      job_stop_4_date: row.data['job_stop_4_date'],
      barco_aberto_date: row.data['barco_aberto_date'],
      fechamento_convesdeck_date: row.data['fechamento_convesdeck_date'],
      barco_fechado_date: row.data['barco_fechado_date'],
      teste_piscina_date: row.data['teste_piscina_date'],
      teste_mar_date: row.data['teste_mar_date'],
      entrega_comercial_date: row.data['entrega_comercial_date'],
    }));

    await upsertMutation.mutateAsync(items);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setSelectedColumns(new Set(COLUMN_MAPPINGS.filter(c => c.required).map(c => c.key)));
    setStep('upload');
    onOpenChange(false);
  };

  // Estatísticas
  const stats = useMemo(() => {
    const valid = parsedRows.filter(r => !r.error);
    const invalid = parsedRows.filter(r => r.error);
    const available = parsedRows.filter(r => r.status === 'available' && !r.error);
    return { total: parsedRows.length, valid: valid.length, invalid: invalid.length, available: available.length };
  }, [parsedRows]);

  // Renderizar por categoria
  const renderColumnCategory = (category: 'basic' | 'jobstops' | 'production' | 'tests', title: string, icon: React.ReactNode) => {
    const columns = COLUMN_MAPPINGS.filter(c => c.category === category);
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {columns.map(col => (
            <div key={col.key} className="flex items-center space-x-2">
              <Checkbox
                id={col.key}
                checked={selectedColumns.has(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
                disabled={col.required}
              />
              <Label htmlFor={col.key} className="text-sm flex items-center gap-1">
                {col.label}
                <span className="text-xs text-muted-foreground">(Col {col.excelColumn})</span>
                {col.required && <Badge variant="secondary" className="text-[10px] px-1">Obrigatório</Badge>}
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Plano Mestre de Produção
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && "Selecione o arquivo Excel com o Plano Mestre de produção."}
            {step === 'columns' && "Escolha quais colunas deseja importar."}
            {step === 'preview' && "Revise os dados antes de importar."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="py-8 space-y-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Arraste e solte ou selecione um arquivo</p>
              <p className="text-sm text-muted-foreground mb-4">Arquivos Excel (.xlsx, .xls)</p>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="headerRow">Linha do cabeçalho:</Label>
              <Input
                id="headerRow"
                type="number"
                value={headerRow}
                onChange={(e) => setHeaderRow(parseInt(e.target.value) || 12)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">(padrão: 12)</span>
            </div>
          </div>
        )}

        {/* Step 2: Column Selection */}
        {step === 'columns' && (
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="h-5 w-5" />
              <span className="font-medium">{file?.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                Trocar arquivo
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {renderColumnCategory('basic', 'Dados Básicos', <Ship className="h-4 w-4" />)}
                <Separator />
                {renderColumnCategory('jobstops', 'Job Stops', <Calendar className="h-4 w-4" />)}
                <Separator />
                {renderColumnCategory('production', 'Marcos de Produção', <Wrench className="h-4 w-4" />)}
                <Separator />
                {renderColumnCategory('tests', 'Testes e Entrega', <TestTube className="h-4 w-4" />)}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="py-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                <p className="text-xs text-muted-foreground">Válidos</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
                <p className="text-xs text-muted-foreground">Com erro</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Disponíveis</p>
              </div>
            </div>

            {/* Preview Table */}
            <ScrollArea className="h-[350px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Linha</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 50).map((row) => (
                    <TableRow key={row.rowNumber} className={row.error ? 'bg-destructive/10' : ''}>
                      <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
                      <TableCell>{row.data['brand'] || '-'}</TableCell>
                      <TableCell>{row.data['model'] || '-'}</TableCell>
                      <TableCell className="font-mono font-bold">{row.data['hull_number']}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'available' ? 'default' : 'secondary'}>
                          {row.status === 'available' ? 'Disponível' : 'Contratada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.error ? (
                          <span className="flex items-center gap-1 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {row.error}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            OK
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRows.length > 50 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Mostrando 50 de {parsedRows.length} linhas...
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          
          {step === 'columns' && (
            <Button onClick={parseFile} disabled={isParsing || selectedColumns.size === 0}>
              {isParsing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Analisar Arquivo
            </Button>
          )}
          
          {step === 'preview' && (
            <Button 
              onClick={handleImport} 
              disabled={stats.valid === 0 || upsertMutation.isPending}
            >
              {upsertMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              <Truck className="h-4 w-4 mr-2" />
              Importar {stats.valid} Matrículas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
