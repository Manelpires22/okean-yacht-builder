import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Truck,
  Wand2
} from "lucide-react";

interface ImportMasterPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FieldDefinition {
  key: string;
  label: string;
  category: 'basic' | 'jobstops' | 'production' | 'tests';
  required?: boolean;
  autoDetectKeywords: string[];
  defaultColumn?: string;
}

// Definição de campos com keywords para auto-detecção
const FIELD_DEFINITIONS: FieldDefinition[] = [
  { key: 'brand', label: 'Marca', category: 'basic', required: true, autoDetectKeywords: ['marca', 'brand'], defaultColumn: 'D' },
  { key: 'model', label: 'Modelo', category: 'basic', required: true, autoDetectKeywords: ['modelo', 'model'], defaultColumn: 'E' },
  { key: 'hull_number', label: 'Matrícula', category: 'basic', required: true, autoDetectKeywords: ['matrícula', 'matricula', 'hull', 'casco'], defaultColumn: 'G' },
  { key: 'job_stop_1_date', label: 'Job Stop 1', category: 'jobstops', autoDetectKeywords: ['js1', 'js 1', 'job stop 1', 'jobstop1'], defaultColumn: 'M' },
  { key: 'job_stop_2_date', label: 'Job Stop 2', category: 'jobstops', autoDetectKeywords: ['js2', 'js 2', 'job stop 2', 'jobstop2'], defaultColumn: 'O' },
  { key: 'job_stop_3_date', label: 'Job Stop 3', category: 'jobstops', autoDetectKeywords: ['js3', 'js 3', 'job stop 3', 'jobstop3'], defaultColumn: 'Q' },
  { key: 'job_stop_4_date', label: 'Job Stop 4', category: 'jobstops', autoDetectKeywords: ['js4', 'js 4', 'job stop 4', 'jobstop4'], defaultColumn: 'S' },
  { key: 'hull_entry_date', label: 'Ingresso Casco', category: 'production', required: true, autoDetectKeywords: ['ingresso', 'entrada', 'entry', 'casco'], defaultColumn: 'AM' },
  { key: 'barco_aberto_date', label: 'Barco Aberto', category: 'production', autoDetectKeywords: ['aberto', 'open'], defaultColumn: 'AN' },
  { key: 'fechamento_convesdeck_date', label: 'Fechamento Convés', category: 'production', autoDetectKeywords: ['convés', 'conves', 'deck', 'fechamento'], defaultColumn: 'AO' },
  { key: 'barco_fechado_date', label: 'Barco Fechado', category: 'production', autoDetectKeywords: ['fechado', 'closed'], defaultColumn: 'AP' },
  { key: 'teste_piscina_date', label: 'Teste Piscina', category: 'tests', autoDetectKeywords: ['piscina', 'pool'], defaultColumn: 'AS' },
  { key: 'teste_mar_date', label: 'Teste Mar', category: 'tests', autoDetectKeywords: ['mar', 'sea'], defaultColumn: 'AT' },
  { key: 'entrega_comercial_date', label: 'Entrega Comercial', category: 'tests', autoDetectKeywords: ['entrega', 'delivery', 'comercial'], defaultColumn: 'AV' },
  { key: 'status', label: 'Cliente (Status)', category: 'basic', autoDetectKeywords: ['cliente', 'client', 'customer'], defaultColumn: 'AA' },
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

interface DetectedHeader {
  letter: string;
  value: string;
}

export function ImportMasterPlanDialog({ open, onOpenChange }: ImportMasterPlanDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [step, setStep] = useState<'upload' | 'columns' | 'preview'>('upload');
  const [headerRow, setHeaderRow] = useState(12);
  
  // Dynamic column mapping
  const [detectedHeaders, setDetectedHeaders] = useState<DetectedHeader[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string | null>>({});

  const { data: yachtModels } = useYachtModels();
  const upsertMutation = useUpsertHullNumbers();

  // Helper para converter índice de coluna para letra do Excel
  const columnIndexToLetter = (index: number): string => {
    let letter = '';
    let idx = index;
    while (idx >= 0) {
      letter = String.fromCharCode((idx % 26) + 65) + letter;
      idx = Math.floor(idx / 26) - 1;
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

  // Parsear status
  const parseStatus = (value: unknown): 'available' | 'contracted' => {
    const str = String(value || '').trim().toLowerCase();
    if (str === 'tbd' || str === 'a definir' || str === '' || str === '-') {
      return 'available';
    }
    return 'contracted';
  };

  // Auto-detectar mapeamento de colunas baseado em keywords
  const autoDetectMappings = useCallback((headers: DetectedHeader[]) => {
    const newMappings: Record<string, string | null> = {};
    
    for (const field of FIELD_DEFINITIONS) {
      // Tentar encontrar coluna por keywords no header
      const match = headers.find(h => 
        field.autoDetectKeywords.some(keyword => 
          h.value.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (match) {
        newMappings[field.key] = match.letter;
      } else if (field.defaultColumn) {
        // Verificar se a coluna default existe nos headers
        const defaultExists = headers.some(h => h.letter === field.defaultColumn);
        newMappings[field.key] = defaultExists ? field.defaultColumn : null;
      } else {
        newMappings[field.key] = null;
      }
    }
    
    setColumnMappings(newMappings);
  }, []);

  // Ler headers do Excel
  const readHeaders = useCallback(async (fileToRead: File, row: number) => {
    try {
      const data = await fileToRead.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];
      
      // Pegar linha do header (row é 1-indexed, array é 0-indexed)
      const headerRowData = jsonData[row - 1] || [];
      
      // Converter para array de {letter, value} - incluir todas as colunas até a última com conteúdo
      const headers: DetectedHeader[] = [];
      for (let idx = 0; idx < headerRowData.length; idx++) {
        const val = headerRowData[idx];
        headers.push({
          letter: columnIndexToLetter(idx),
          value: String(val || '').trim()
        });
      }
      
      setDetectedHeaders(headers);
      autoDetectMappings(headers);
    } catch (error) {
      console.error('Erro ao ler headers:', error);
    }
  }, [autoDetectMappings, columnIndexToLetter]);

  // Handler para arquivo selecionado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    await readHeaders(selectedFile, headerRow);
    setStep('columns');
  };

  // Re-ler headers quando mudar a linha do header
  useEffect(() => {
    if (file && step === 'columns') {
      readHeaders(file, headerRow);
    }
  }, [headerRow, file, step, readHeaders]);

  // Parsear o arquivo com os mapeamentos dinâmicos
  const parseFile = useCallback(async () => {
    if (!file) return;

    setIsParsing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      
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
        
        // Extrair dados de cada campo usando o mapeamento dinâmico
        for (const field of FIELD_DEFINITIONS) {
          const mappedColumn = columnMappings[field.key];
          if (!mappedColumn) continue;
          
          const colIndex = letterToColumnIndex(mappedColumn);
          const value = row[colIndex];
          
          if (field.key === 'hull_number' || field.key === 'brand' || field.key === 'model' || field.key === 'status') {
            rowData[field.key] = value ? String(value).trim() : null;
          } else {
            // É uma data
            rowData[field.key] = parseExcelDate(value);
          }
        }

        // Determinar status
        const status = parseStatus(rowData['status']);

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
  }, [file, headerRow, columnMappings, findModelId, parseExcelDate]);

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
    setDetectedHeaders([]);
    setColumnMappings({});
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

  // Verificar se campos obrigatórios estão mapeados
  const requiredFieldsMapped = useMemo(() => {
    return FIELD_DEFINITIONS.filter(f => f.required).every(f => columnMappings[f.key]);
  }, [columnMappings]);

  // Campos mapeados para exibição no preview
  const mappedDateFields = useMemo(() => {
    return FIELD_DEFINITIONS.filter(f => 
      f.category !== 'basic' && 
      f.key !== 'status' && 
      columnMappings[f.key]
    );
  }, [columnMappings]);

  // Renderizar selector de coluna para um campo
  const ColumnSelector = ({ field }: { field: FieldDefinition }) => (
    <div className="flex items-center gap-3 py-2">
      <div className="w-44 flex items-center gap-2">
        <span className="text-sm font-medium">{field.label}</span>
        {field.required && <Badge variant="secondary" className="text-[10px] px-1">Obrigatório</Badge>}
      </div>
      <Select 
        value={columnMappings[field.key] || '_none_'} 
        onValueChange={(v) => setColumnMappings(prev => ({...prev, [field.key]: v === '_none_' ? null : v}))}
      >
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Selecione a coluna..." />
        </SelectTrigger>
        <SelectContent 
          className="max-h-60 z-[9999]"
          position="popper"
          sideOffset={4}
        >
          {!field.required && (
            <SelectItem value="_none_">
              <span className="text-muted-foreground">(Não importar)</span>
            </SelectItem>
          )}
          {detectedHeaders.map(h => (
            <SelectItem key={h.letter} value={h.letter}>
              <span className="font-mono mr-2 text-muted-foreground">{h.letter}</span>
              <span className="truncate">{h.value || '(vazio)'}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Renderizar categoria de campos
  const renderFieldCategory = (category: 'basic' | 'jobstops' | 'production' | 'tests', title: string, icon: React.ReactNode) => {
    const fields = FIELD_DEFINITIONS.filter(f => f.category === category);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </div>
        <div className="pl-6 space-y-1">
          {fields.map(field => (
            <ColumnSelector key={field.key} field={field} />
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
            {step === 'columns' && "Mapeie as colunas do Excel para os campos do sistema."}
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

        {/* Step 2: Column Mapping */}
        {step === 'columns' && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span className="font-medium">{file?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="headerRowEdit" className="text-sm">Linha do header:</Label>
                <Input
                  id="headerRowEdit"
                  type="number"
                  value={headerRow}
                  onChange={(e) => setHeaderRow(parseInt(e.target.value) || 12)}
                  className="w-16 h-8"
                />
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                  Trocar arquivo
                </Button>
              </div>
            </div>

            {detectedHeaders.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg text-sm">
                <Wand2 className="h-4 w-4 text-primary" />
                <span>{detectedHeaders.filter(h => h.value).length} colunas detectadas. Mapeamento automático aplicado.</span>
              </div>
            )}

            <div className="h-[400px] overflow-y-auto pr-4">
              <div className="space-y-6">
                {renderFieldCategory('basic', 'Dados Básicos', <Ship className="h-4 w-4" />)}
                <Separator />
                {renderFieldCategory('jobstops', 'Job Stops', <Calendar className="h-4 w-4" />)}
                <Separator />
                {renderFieldCategory('production', 'Marcos de Produção', <Wrench className="h-4 w-4" />)}
                <Separator />
                {renderFieldCategory('tests', 'Testes e Entrega', <TestTube className="h-4 w-4" />)}
              </div>
            </div>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 sticky left-0 bg-background z-10">Linha</TableHead>
                      <TableHead className="whitespace-nowrap">Marca</TableHead>
                      <TableHead className="whitespace-nowrap">Modelo</TableHead>
                      <TableHead className="whitespace-nowrap">Matrícula</TableHead>
                      
                      {/* Datas mapeadas dinamicamente */}
                      {mappedDateFields.map(field => (
                        <TableHead key={field.key} className="text-center text-xs px-2 whitespace-nowrap">
                          {field.label.split(' ')[0]}
                        </TableHead>
                      ))}
                      
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 50).map((row) => {
                      const formatPreviewDate = (dateStr: string | null | undefined) => {
                        if (!dateStr) return <span className="text-muted-foreground">—</span>;
                        try {
                          return <span className="text-primary font-medium">{format(new Date(dateStr), "dd/MM")}</span>;
                        } catch {
                          return <span className="text-muted-foreground">—</span>;
                        }
                      };
                      
                      return (
                        <TableRow key={row.rowNumber} className={row.error ? 'bg-destructive/10' : ''}>
                          <TableCell className="font-mono text-xs sticky left-0 bg-background z-10">{row.rowNumber}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.data['brand'] || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.data['model'] || '-'}</TableCell>
                          <TableCell className="font-mono font-bold whitespace-nowrap">{row.data['hull_number']}</TableCell>
                          
                          {/* Datas mapeadas dinamicamente */}
                          {mappedDateFields.map(field => (
                            <TableCell key={field.key} className="text-center text-xs px-2">
                              {formatPreviewDate(row.data[field.key])}
                            </TableCell>
                          ))}
                          
                          <TableCell>
                            <Badge variant={row.status === 'available' ? 'default' : 'secondary'}>
                              {row.status === 'available' ? 'Disponível' : 'Contratada'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.error ? (
                              <span className="flex items-center gap-1 text-destructive text-sm whitespace-nowrap">
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
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
            <Button onClick={parseFile} disabled={isParsing || !requiredFieldsMapped}>
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
