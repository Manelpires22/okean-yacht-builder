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
  job_stop_stage: string;
  job_stop_days_limit: number | null;
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
  _categoryError?: boolean; // Flag para indicar categoria não encontrada
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
  job_stop_stage: string;
  job_stop_days_limit: number | null;
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

// ===== MEMORIAL CATEGORIES =====

export interface CategoryExportRow {
  value: string;
  label: string;
  description: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

export interface CategoryImportRow {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  display_order?: number;
  is_active?: boolean;
}

// ===== UPGRADES =====

export interface UpgradeExportRow {
  code: string;
  name: string;
  description: string;
  brand: string;
  model: string;
  memorial_item_name: string;
  memorial_item_category: string;
  price: number;
  delivery_days_impact: number;
  is_active: boolean;
  is_customizable: boolean;
  is_configurable: boolean;
  job_stop_stage: string;
  job_stop_days_limit: number | null;
}

export interface UpgradeImportRow {
  code: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  memorial_item_name?: string; // Agora opcional - permite importar sem vínculo
  price: number;
  delivery_days_impact?: number;
  is_active?: boolean;
  is_customizable?: boolean;
  is_configurable?: boolean;
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
    job_stop_stage: item.job_stop?.stage || '',
    job_stop_days_limit: item.job_stop?.days_limit ?? null,
  }));
}

export function validateMemorialImportData(
  data: any[], 
  existingCategories?: { label: string }[]
): { valid: boolean; errors: string[]; rows: MemorialImportRow[]; unmatchedCategories: string[]; duplicateCount: number; duplicateKeys: Set<string> } {
  const errors: string[] = [];
  const validRows: MemorialImportRow[] = [];
  const unmatchedCategories: string[] = [];
  
  if (!data || data.length === 0) {
    return { valid: false, errors: ['Arquivo vazio ou sem dados válidos'], rows: [], unmatchedCategories: [], duplicateCount: 0, duplicateKeys: new Set() };
  }
  
  // Criar set de categorias existentes (lowercase para comparação case-insensitive)
  const existingLabels = existingCategories 
    ? new Set(existingCategories.map(c => c.label.toLowerCase()))
    : null;
  
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because Excel rows start at 1 and header is row 1
    
    if (!row.categoria) {
      errors.push(`Linha ${rowNum}: Categoria é obrigatória`);
    }
    if (!row.item_name) {
      errors.push(`Linha ${rowNum}: Nome do item é obrigatório`);
    }
    
    if (row.categoria && row.item_name) {
      const categoria = String(row.categoria).trim();
      const categoryNotFound = existingLabels && !existingLabels.has(categoria.toLowerCase());
      
      // Track unique unmatched categories
      if (categoryNotFound && !unmatchedCategories.includes(categoria)) {
        unmatchedCategories.push(categoria);
      }
      
      validRows.push({
        categoria,
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
        _categoryError: categoryNotFound || false,
      });
    }
  });
  
  // Detectar duplicatas no arquivo (mesma categoria + item_name)
  // Primeiro, contar ocorrências de cada chave
  const keyCount = new Map<string, number>();
  validRows.forEach(row => {
    const key = `${row.categoria.toLowerCase()}|${row.item_name.toLowerCase()}`;
    keyCount.set(key, (keyCount.get(key) || 0) + 1);
  });
  
  // Coletar chaves que aparecem mais de uma vez
  const duplicateKeys = new Set<string>();
  const duplicateLabels: string[] = [];
  
  keyCount.forEach((count, key) => {
    if (count > 1) {
      duplicateKeys.add(key);
      const [categoria, itemName] = key.split('|');
      // Find original case names
      const originalRow = validRows.find(r => 
        r.categoria.toLowerCase() === categoria && 
        r.item_name.toLowerCase() === itemName
      );
      if (originalRow) {
        duplicateLabels.push(`"${originalRow.item_name}" em "${originalRow.categoria}"`);
      }
    }
  });
  
  if (duplicateLabels.length > 0) {
    const displayDuplicates = duplicateLabels.slice(0, 5).join(', ');
    const moreCount = duplicateLabels.length > 5 ? ` e mais ${duplicateLabels.length - 5}` : '';
    errors.push(`⚠️ ${duplicateLabels.length} itens duplicados no arquivo: ${displayDuplicates}${moreCount}`);
  }
  
  return { 
    valid: errors.length === 0 || (errors.length === 1 && duplicateLabels.length > 0), // Duplicatas são apenas aviso
    errors, 
    rows: validRows,
    unmatchedCategories,
    duplicateCount: duplicateLabels.length,
    duplicateKeys,
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
    job_stop_stage: opt.job_stop?.stage || '',
    job_stop_days_limit: opt.job_stop?.days_limit ?? null,
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
      job_stop_stage: "JS1",
      job_stop_days_limit: 300,
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
      job_stop_stage: "JS2",
      job_stop_days_limit: 120,
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
      job_stop_stage: "JS3",
      job_stop_days_limit: 90,
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
      job_stop_stage: "JS4",
      job_stop_days_limit: 60,
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
      job_stop_stage: "",
      job_stop_days_limit: null,
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
      job_stop_stage: "JS3",
      job_stop_days_limit: 90,
    },
    {
      code: "OPT-002",
      name: "Sistema de Som Premium",
      description: "Sistema Bose Marine com 8 alto-falantes",
      category: "Entretenimento",
      base_price: 32000,
      delivery_days_impact: 7,
      is_active: true,
      job_stop_stage: "JS4",
      job_stop_days_limit: 60,
    },
    {
      code: "OPT-003",
      name: "Teak no Cockpit",
      description: "Revestimento em teak certificado",
      category: "Acabamento",
      base_price: 85000,
      delivery_days_impact: 30,
      is_active: true,
      job_stop_stage: "JS2",
      job_stop_days_limit: 120,
    },
    {
      code: "OPT-004",
      name: "Gerador Auxiliar",
      description: "Gerador diesel 5kW para backup",
      category: "Sistema Elétrico",
      base_price: 58000,
      delivery_days_impact: 21,
      is_active: true,
      job_stop_stage: "JS1",
      job_stop_days_limit: 300,
    },
  ];
}

// ===== UPGRADES SPECIFIC =====

export function transformUpgradesForExport(upgrades: any[]): UpgradeExportRow[] {
  return upgrades.map(u => ({
    code: u.code || '',
    name: u.name || '',
    description: u.description || '',
    brand: u.brand || '',
    model: u.model || '',
    memorial_item_name: u.memorial_item?.item_name || '',
    memorial_item_category: u.memorial_item?.category?.label || '',
    price: u.price || 0,
    delivery_days_impact: u.delivery_days_impact || 0,
    is_active: u.is_active ?? true,
    is_customizable: u.is_customizable ?? true,
    is_configurable: u.is_configurable ?? false,
    job_stop_stage: u.job_stop?.stage || '',
    job_stop_days_limit: u.job_stop?.days_limit ?? null,
  }));
}

export function validateUpgradesImportData(data: any[]): { valid: boolean; errors: string[]; rows: UpgradeImportRow[]; pendingLinkCount: number } {
  const errors: string[] = [];
  const validRows: UpgradeImportRow[] = [];
  let pendingLinkCount = 0;
  
  if (!data || data.length === 0) {
    return { valid: false, errors: ['Arquivo vazio ou sem dados válidos'], rows: [], pendingLinkCount: 0 };
  }
  
  data.forEach((row, index) => {
    const rowNum = index + 2;
    
    if (!row.code) {
      errors.push(`Linha ${rowNum}: Código é obrigatório`);
    }
    if (!row.name) {
      errors.push(`Linha ${rowNum}: Nome é obrigatório`);
    }
    // memorial_item_name não é mais obrigatório - contamos quantos ficam pendentes
    if (!row.memorial_item_name) {
      pendingLinkCount++;
    }
    if (row.price === undefined || row.price === null || row.price === '') {
      errors.push(`Linha ${rowNum}: Preço é obrigatório`);
    }
    
    // Agora aceita mesmo sem memorial_item_name
    if (row.code && row.name && row.price !== undefined) {
      validRows.push({
        code: String(row.code).trim(),
        name: String(row.name).trim(),
        description: row.description ? String(row.description).trim() : undefined,
        brand: row.brand ? String(row.brand).trim() : undefined,
        model: row.model ? String(row.model).trim() : undefined,
        memorial_item_name: row.memorial_item_name ? String(row.memorial_item_name).trim() : undefined,
        price: Number(row.price),
        delivery_days_impact: row.delivery_days_impact ? Number(row.delivery_days_impact) : 0,
        is_active: parseBoolean(row.is_active, true),
        is_customizable: parseBoolean(row.is_customizable, true),
        is_configurable: parseBoolean(row.is_configurable, false),
      });
    }
  });
  
  return { 
    valid: errors.length === 0, 
    errors, 
    rows: validRows,
    pendingLinkCount
  };
}

export function generateUpgradesTemplate(): UpgradeExportRow[] {
  return [
    {
      code: "UPG-001",
      name: "Gerador 15KW Premium",
      description: "Gerador silencioso de alta performance",
      brand: "ONAN",
      model: "15MDKBR",
      memorial_item_name: "Gerador Principal",
      memorial_item_category: "Sistema Elétrico",
      price: 45000,
      delivery_days_impact: 15,
      is_active: true,
      is_customizable: true,
      is_configurable: false,
      job_stop_stage: "JS2",
      job_stop_days_limit: 120,
    },
    {
      code: "UPG-002",
      name: "Motor 450HP Racing",
      description: "Motor de alta potência para performance",
      brand: "Mercury",
      model: "450R",
      memorial_item_name: "Motor de Popa",
      memorial_item_category: "Propulsão",
      price: 120000,
      delivery_days_impact: 30,
      is_active: true,
      is_customizable: false,
      is_configurable: false,
      job_stop_stage: "JS1",
      job_stop_days_limit: 300,
    },
    {
      code: "UPG-003",
      name: "Ar Condicionado 48.000 BTU",
      description: "Sistema de climatização reforçado",
      brand: "Webasto",
      model: "BlueCool S48",
      memorial_item_name: "Ar Condicionado",
      memorial_item_category: "Conforto",
      price: 28000,
      delivery_days_impact: 10,
      is_active: true,
      is_customizable: true,
      is_configurable: true,
      job_stop_stage: "JS3",
      job_stop_days_limit: 90,
    },
  ];
}

// ===== CATEGORIES SPECIFIC =====

export function transformCategoriesForExport(categories: any[]): CategoryExportRow[] {
  return categories.map(cat => ({
    value: cat.value || '',
    label: cat.label || '',
    description: cat.description || '',
    icon: cat.icon || '',
    display_order: cat.display_order || 0,
    is_active: cat.is_active ?? true,
  }));
}

export function validateCategoriesImportData(data: any[]): { valid: boolean; errors: string[]; rows: CategoryImportRow[] } {
  const errors: string[] = [];
  const validRows: CategoryImportRow[] = [];
  
  if (!data || data.length === 0) {
    return { valid: false, errors: ['Arquivo vazio ou sem dados válidos'], rows: [] };
  }
  
  data.forEach((row, index) => {
    const rowNum = index + 2;
    
    if (!row.value) {
      errors.push(`Linha ${rowNum}: Código (value) é obrigatório`);
    }
    if (!row.label) {
      errors.push(`Linha ${rowNum}: Nome (label) é obrigatório`);
    }
    
    if (row.value && row.label) {
      validRows.push({
        value: String(row.value).trim().toLowerCase().replace(/\s+/g, '_'),
        label: String(row.label).trim(),
        description: row.description ? String(row.description).trim() : undefined,
        icon: row.icon ? String(row.icon).trim() : undefined,
        display_order: row.display_order ? Number(row.display_order) : index + 1,
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

export function generateCategoriesTemplate(): CategoryExportRow[] {
  return [
    {
      value: "deck_principal",
      label: "Deck Principal",
      description: "Área principal do convés superior",
      icon: "⛵",
      display_order: 1,
      is_active: true,
    },
    {
      value: "casco_estrutura",
      label: "Casco e Estrutura",
      description: "Componentes estruturais do barco",
      icon: "🚢",
      display_order: 2,
      is_active: true,
    },
    {
      value: "sistema_eletrico",
      label: "Sistema Elétrico",
      description: "Componentes elétricos e eletrônicos",
      icon: "⚡",
      display_order: 3,
      is_active: true,
    },
    {
      value: "conforto",
      label: "Conforto",
      description: "Itens de conforto e climatização",
      icon: "❄️",
      display_order: 4,
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
