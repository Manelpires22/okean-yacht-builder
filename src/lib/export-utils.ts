import * as XLSX from 'xlsx';

// ===== MEMORIAL ITEMS =====

export interface MemorialExportRow {
  categoria: string;
  item_name: string;
  description: string;
  brand: string;
  model: string;
  quantity: number;
  unit: string;
  display_order: number;
  is_customizable: boolean;
  is_configurable: boolean;
  is_active: boolean;
}

export interface MemorialImportRow {
  categoria: string;
  item_name: string;
  description?: string;
  brand?: string;
  model?: string;
  quantity?: number;
  unit?: string;
  display_order?: number;
  is_customizable?: boolean;
  is_configurable?: boolean;
  is_active?: boolean;
}

// ===== OPTIONS =====

export interface OptionExportRow {
  code: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  delivery_days_impact: number;
  is_active: boolean;
}

export interface OptionImportRow {
  code: string;
  name: string;
  description?: string;
  category: string;
  base_price: number;
  delivery_days_impact?: number;
  is_active?: boolean;
}

// ===== EXPORT FUNCTIONS =====

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Dados'
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const maxWidths: number[] = [];
  const headers = Object.keys(data[0] || {});
  
  headers.forEach((header, i) => {
    maxWidths[i] = header.length;
    data.forEach(row => {
      const cellValue = String(row[header] ?? '');
      maxWidths[i] = Math.max(maxWidths[i], cellValue.length);
    });
  });
  
  worksheet['!cols'] = maxWidths.map(w => ({ wch: Math.min(w + 2, 50) }));
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== IMPORT FUNCTIONS =====

export async function parseExcelFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// ===== MEMORIAL SPECIFIC =====

export function transformMemorialItemsForExport(items: any[]): MemorialExportRow[] {
  return items.map(item => ({
    categoria: item.category?.label || item.category || '',
    item_name: item.item_name || '',
    description: item.description || '',
    brand: item.brand || '',
    model: item.model || '',
    quantity: item.quantity || 1,
    unit: item.unit || 'unidade',
    display_order: item.display_order || 0,
    is_customizable: item.is_customizable ?? true,
    is_configurable: item.is_configurable ?? false,
    is_active: item.is_active ?? true,
  }));
}

export function validateMemorialImportData(data: any[]): { valid: boolean; errors: string[]; rows: MemorialImportRow[] } {
  const errors: string[] = [];
  const validRows: MemorialImportRow[] = [];
  
  if (!data || data.length === 0) {
    return { valid: false, errors: ['Arquivo vazio ou sem dados válidos'], rows: [] };
  }
  
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because Excel rows start at 1 and header is row 1
    
    if (!row.categoria) {
      errors.push(`Linha ${rowNum}: Categoria é obrigatória`);
    }
    if (!row.item_name) {
      errors.push(`Linha ${rowNum}: Nome do item é obrigatório`);
    }
    
    if (row.categoria && row.item_name) {
      validRows.push({
        categoria: String(row.categoria).trim(),
        item_name: String(row.item_name).trim(),
        description: row.description ? String(row.description).trim() : undefined,
        brand: row.brand ? String(row.brand).trim() : undefined,
        model: row.model ? String(row.model).trim() : undefined,
        quantity: row.quantity ? Number(row.quantity) : 1,
        unit: row.unit ? String(row.unit).trim() : 'unidade',
        display_order: row.display_order ? Number(row.display_order) : index + 1,
        is_customizable: parseBoolean(row.is_customizable, true),
        is_configurable: parseBoolean(row.is_configurable, false),
        is_active: parseBoolean(row.is_active, true),
      });
    }
  });
  
  return { 
    valid: errors.length === 0, 
    errors, 
    rows: validRows 
  };
}

// ===== OPTIONS SPECIFIC =====

export function transformOptionsForExport(options: any[]): OptionExportRow[] {
  return options.map(opt => ({
    code: opt.code || '',
    name: opt.name || '',
    description: opt.description || '',
    category: opt.category?.name || '',
    base_price: opt.base_price || 0,
    delivery_days_impact: opt.delivery_days_impact || 0,
    is_active: opt.is_active ?? true,
  }));
}

export function validateOptionsImportData(data: any[]): { valid: boolean; errors: string[]; rows: OptionImportRow[] } {
  const errors: string[] = [];
  const validRows: OptionImportRow[] = [];
  
  if (!data || data.length === 0) {
    return { valid: false, errors: ['Arquivo vazio ou sem dados válidos'], rows: [] };
  }
  
  data.forEach((row, index) => {
    const rowNum = index + 2;
    
    if (!row.code) {
      errors.push(`Linha ${rowNum}: Código é obrigatório`);
    }
    if (!row.name) {
      errors.push(`Linha ${rowNum}: Nome é obrigatório`);
    }
    if (!row.category) {
      errors.push(`Linha ${rowNum}: Categoria é obrigatória`);
    }
    if (row.base_price === undefined || row.base_price === null || row.base_price === '') {
      errors.push(`Linha ${rowNum}: Preço base é obrigatório`);
    }
    
    if (row.code && row.name && row.category && row.base_price !== undefined) {
      validRows.push({
        code: String(row.code).trim(),
        name: String(row.name).trim(),
        description: row.description ? String(row.description).trim() : undefined,
        category: String(row.category).trim(),
        base_price: Number(row.base_price),
        delivery_days_impact: row.delivery_days_impact ? Number(row.delivery_days_impact) : 0,
        is_active: parseBoolean(row.is_active, true),
      });
    }
  });
  
  return { 
    valid: errors.length === 0, 
    errors, 
    rows: validRows 
  };
}

// ===== TEMPLATE GENERATORS =====

export function generateMemorialTemplate(): MemorialExportRow[] {
  return [
    {
      categoria: "Casco e Estrutura",
      item_name: "Casco em Fibra de Vidro",
      description: "Laminação manual com resina vinilester",
      brand: "OKEAN",
      model: "-",
      quantity: 1,
      unit: "unidade",
      display_order: 1,
      is_customizable: true,
      is_configurable: false,
      is_active: true,
    },
    {
      categoria: "Sistema Elétrico",
      item_name: "Gerador Principal",
      description: "Gerador diesel silencioso",
      brand: "Kohler",
      model: "11EKOZD",
      quantity: 1,
      unit: "unidade",
      display_order: 10,
      is_customizable: true,
      is_configurable: true,
      is_active: true,
    },
    {
      categoria: "Conforto",
      item_name: "Ar Condicionado",
      description: "Sistema split 24.000 BTU",
      brand: "Webasto",
      model: "BlueCool",
      quantity: 2,
      unit: "unidade",
      display_order: 20,
      is_customizable: true,
      is_configurable: false,
      is_active: true,
    },
    {
      categoria: "Navegação",
      item_name: "GPS Chartplotter",
      description: "Tela 12 polegadas multifuncional",
      brand: "Garmin",
      model: "GPSMAP 1243",
      quantity: 1,
      unit: "unidade",
      display_order: 30,
      is_customizable: false,
      is_configurable: true,
      is_active: true,
    },
    {
      categoria: "Acabamento",
      item_name: "Revestimento Interno",
      description: "Couro sintético premium",
      brand: "-",
      model: "-",
      quantity: 50,
      unit: "m²",
      display_order: 40,
      is_customizable: true,
      is_configurable: false,
      is_active: true,
    },
  ];
}

export function generateOptionsTemplate(): OptionExportRow[] {
  return [
    {
      code: "OPT-001",
      name: "Ar Condicionado Extra",
      description: "Sistema adicional de 24.000 BTU",
      category: "Conforto",
      base_price: 45000,
      delivery_days_impact: 15,
      is_active: true,
    },
    {
      code: "OPT-002",
      name: "Sistema de Som Premium",
      description: "Sistema Bose Marine com 8 alto-falantes",
      category: "Entretenimento",
      base_price: 32000,
      delivery_days_impact: 7,
      is_active: true,
    },
    {
      code: "OPT-003",
      name: "Teak no Cockpit",
      description: "Revestimento em teak certificado",
      category: "Acabamento",
      base_price: 85000,
      delivery_days_impact: 30,
      is_active: true,
    },
    {
      code: "OPT-004",
      name: "Gerador Auxiliar",
      description: "Gerador diesel 5kW para backup",
      category: "Sistema Elétrico",
      base_price: 58000,
      delivery_days_impact: 21,
      is_active: true,
    },
  ];
}

// ===== HELPERS =====

function parseBoolean(value: any, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === 'sim' || lower === 'yes' || lower === '1') return true;
    if (lower === 'false' || lower === 'não' || lower === 'nao' || lower === 'no' || lower === '0') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
}

export function generateFilename(prefix: string, modelCode: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${modelCode}_${date}`;
}
