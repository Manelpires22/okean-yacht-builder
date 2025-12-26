// Types for PDF Builder & Template Manager

export type DocumentType = 'quotation' | 'ato' | 'consolidated' | 'memorial';

export type BlockType = 
  | 'header' 
  | 'buyer' 
  | 'boat' 
  | 'technical_panel'
  | 'memorial' 
  | 'upgrades' 
  | 'options' 
  | 'customizations'
  | 'financial_summary'
  | 'signatures'
  | 'notes'
  | 'text'
  | 'image'
  | 'page_break';

export interface PDFBlockConfig {
  showLogo?: boolean;
  showCNPJ?: boolean;
  columns?: number;
  showPrices?: boolean;
  showDeliveryImpact?: boolean;
  textContent?: string;
  imageUrl?: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: number;
  [key: string]: unknown;
}

export interface PDFBlock {
  id: string;
  type: BlockType;
  label: string;
  order: number;
  visible: boolean;
  config: PDFBlockConfig;
}

export interface PDFTemplateSettings {
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showPageNumbers: boolean;
  showConfidentialityNote: boolean;
  language: 'pt-BR' | 'en-US';
}

export interface PDFTemplateJSON {
  blocks: PDFBlock[];
  settings: PDFTemplateSettings;
}

export type TemplateStatus = 'draft' | 'active' | 'archived';

export interface PDFTemplate {
  id: string;
  name: string;
  document_type: DocumentType;
  branding: string;
  description: string | null;
  template_json: PDFTemplateJSON;
  version: number;
  status: TemplateStatus;
  is_default: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PDFTemplateVersion {
  id: string;
  template_id: string;
  version: number;
  template_json: PDFTemplateJSON;
  changed_by: string | null;
  change_notes: string | null;
  created_at: string;
}

export interface PDFGenerated {
  id: string;
  template_id: string | null;
  document_type: DocumentType;
  reference_id: string | null;
  reference_type: string | null;
  payload: Record<string, unknown> | null;
  pdf_url: string | null;
  generated_by: string | null;
  created_at: string;
}

// Block definitions for the library
export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  defaultConfig: PDFBlockConfig;
  availableFor: DocumentType[];
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'header',
    label: 'Cabeçalho Institucional',
    description: 'Logo OKEAN e informações da empresa',
    icon: 'Building2',
    defaultConfig: { showLogo: true, showCNPJ: true },
    availableFor: ['quotation', 'ato', 'consolidated', 'memorial'],
  },
  {
    type: 'buyer',
    label: 'Comprador',
    description: 'Dados do cliente/comprador',
    icon: 'User',
    defaultConfig: {},
    availableFor: ['quotation', 'ato', 'consolidated'],
  },
  {
    type: 'boat',
    label: 'Barco',
    description: 'Informações do modelo do iate',
    icon: 'Ship',
    defaultConfig: {},
    availableFor: ['quotation', 'ato', 'consolidated', 'memorial'],
  },
  {
    type: 'technical_panel',
    label: 'Painel Técnico',
    description: 'Especificações técnicas do barco',
    icon: 'Settings',
    defaultConfig: {},
    availableFor: ['quotation', 'consolidated', 'memorial'],
  },
  {
    type: 'memorial',
    label: 'Memorial Descritivo',
    description: 'Lista de itens do memorial em duas colunas',
    icon: 'List',
    defaultConfig: { columns: 2, showPrices: false },
    availableFor: ['quotation', 'consolidated', 'memorial'],
  },
  {
    type: 'upgrades',
    label: 'Upgrades',
    description: 'Lista de upgrades selecionados',
    icon: 'ArrowUpCircle',
    defaultConfig: { showPrices: true, showDeliveryImpact: true },
    availableFor: ['quotation', 'ato', 'consolidated'],
  },
  {
    type: 'options',
    label: 'Opcionais',
    description: 'Lista de opcionais selecionados',
    icon: 'Plus',
    defaultConfig: { showPrices: true, showDeliveryImpact: true },
    availableFor: ['quotation', 'ato', 'consolidated'],
  },
  {
    type: 'customizations',
    label: 'Customizações',
    description: 'Customizações especiais do cliente',
    icon: 'Paintbrush',
    defaultConfig: { showPrices: true, showDeliveryImpact: true },
    availableFor: ['quotation', 'ato', 'consolidated'],
  },
  {
    type: 'financial_summary',
    label: 'Resumo Financeiro',
    description: 'Valores totais e condições de pagamento',
    icon: 'DollarSign',
    defaultConfig: {},
    availableFor: ['quotation', 'ato', 'consolidated'],
  },
  {
    type: 'signatures',
    label: 'Assinaturas',
    description: 'Campos para assinatura do vendedor e cliente',
    icon: 'PenTool',
    defaultConfig: {},
    availableFor: ['quotation', 'ato', 'consolidated'],
  },
  {
    type: 'notes',
    label: 'Observações',
    description: 'Notas e observações gerais',
    icon: 'FileText',
    defaultConfig: {},
    availableFor: ['quotation', 'ato', 'consolidated', 'memorial'],
  },
  {
    type: 'text',
    label: 'Texto Livre',
    description: 'Bloco de texto personalizado',
    icon: 'Type',
    defaultConfig: { textContent: '', alignment: 'left', fontSize: 10 },
    availableFor: ['quotation', 'ato', 'consolidated', 'memorial'],
  },
  {
    type: 'image',
    label: 'Imagem',
    description: 'Bloco de imagem personalizada',
    icon: 'Image',
    defaultConfig: { imageUrl: '', alignment: 'center' },
    availableFor: ['quotation', 'ato', 'consolidated', 'memorial'],
  },
  {
    type: 'page_break',
    label: 'Quebra de Página',
    description: 'Força uma nova página',
    icon: 'Minus',
    defaultConfig: {},
    availableFor: ['quotation', 'ato', 'consolidated', 'memorial'],
  },
];

// Helper to get document type label
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  quotation: 'Cotação',
  ato: 'ATO',
  consolidated: 'Consolidado',
  memorial: 'Memorial Técnico',
};

export const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};
