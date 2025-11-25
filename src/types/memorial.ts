// Tipos temporários para memorial_categories até regenerar types do Supabase
export interface MemorialCategory {
  id: string;
  value: string;
  label: string;
  display_order: number;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemorialItem {
  id: string;
  yacht_model_id: string;
  category_id: string;
  category?: MemorialCategory;
  item_name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  quantity: number;
  unit: string;
  display_order: number;
  category_display_order: number;
  is_customizable: boolean;
  is_configurable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  technical_specs: any;
  job_stop_id: string | null;
  configurable_sub_items: any;
}
