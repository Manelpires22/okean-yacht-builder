import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MemorialUpgrade {
  id: string;
  yacht_model_id: string;
  memorial_item_id: string;
  code: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  price: number;
  delivery_days_impact: number;
  job_stop_id?: string;
  is_configurable: boolean;
  configurable_sub_items: any[];
  is_customizable: boolean;
  is_active: boolean;
  display_order: number;
  technical_specs?: any;
  created_at: string;
  updated_at: string;
  memorial_item?: {
    id: string;
    item_name: string;
    category_id: string;
  };
  job_stop?: {
    id: string;
    stage: string;
    days_limit: number;
    item_name: string;
  };
}

export function useMemorialUpgrades(yachtModelId: string) {
  return useQuery({
    queryKey: ['memorial-upgrades', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_upgrades')
        .select(`
          *,
          memorial_item:memorial_items(id, item_name, category_id),
          job_stop:job_stops!memorial_upgrades_job_stop_id_fkey(id, stage, days_limit, item_name)
        `)
        .eq('yacht_model_id', yachtModelId)
        .order('memorial_item_id')
        .order('display_order');
      
      if (error) throw error;
      return data as MemorialUpgrade[];
    },
    enabled: !!yachtModelId,
  });
}

export function useMemorialItemsWithUpgrades(yachtModelId: string) {
  return useQuery({
    queryKey: ['memorial-items-with-upgrades', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_items')
        .select('id, item_name, category_id, category:memorial_categories(id, label)')
        .eq('yacht_model_id', yachtModelId)
        .eq('has_upgrades', true)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
    enabled: !!yachtModelId,
  });
}

// Hook para buscar TODOS os itens do memorial (para criação de upgrades)
export function useAllMemorialItemsForUpgrades(yachtModelId: string) {
  return useQuery({
    queryKey: ['all-memorial-items-for-upgrades', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_items')
        .select('id, item_name, category_id, has_upgrades, category:memorial_categories(id, label)')
        .eq('yacht_model_id', yachtModelId)
        .eq('is_active', true)
        .order('category_display_order')
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
    enabled: !!yachtModelId,
  });
}

export function useCreateMemorialUpgrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (upgrade: Omit<MemorialUpgrade, 'id' | 'created_at' | 'updated_at' | 'memorial_item' | 'job_stop'>) => {
      // 1. Criar o upgrade
      const { data, error } = await supabase
        .from('memorial_upgrades')
        .insert(upgrade as any)
        .select()
        .single();
      
      if (error) throw error;

      // 2. Atualizar has_upgrades do item do memorial automaticamente
      const { error: updateError } = await supabase
        .from('memorial_items')
        .update({ has_upgrades: true })
        .eq('id', upgrade.memorial_item_id);
      
      if (updateError) {
        console.error('Erro ao atualizar has_upgrades:', updateError);
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorial-upgrades', variables.yacht_model_id] });
      queryClient.invalidateQueries({ queryKey: ['memorial-items-with-upgrades', variables.yacht_model_id] });
      queryClient.invalidateQueries({ queryKey: ['all-memorial-items-for-upgrades', variables.yacht_model_id] });
      queryClient.invalidateQueries({ queryKey: ['memorial-items', variables.yacht_model_id] });
      toast.success('Upgrade criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar upgrade: ' + error.message);
    },
  });
}

export function useUpdateMemorialUpgrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, yachtModelId, ...data }: { id: string; yachtModelId: string } & Partial<MemorialUpgrade>) => {
      const { error } = await supabase
        .from('memorial_upgrades')
        .update(data as any)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorial-upgrades', variables.yachtModelId] });
      toast.success('Upgrade atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar upgrade: ' + error.message);
    },
  });
}

export function useDeleteMemorialUpgrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, yachtModelId }: { id: string; yachtModelId: string }) => {
      const { error } = await supabase
        .from('memorial_upgrades')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorial-upgrades', variables.yachtModelId] });
      toast.success('Upgrade deletado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao deletar upgrade: ' + error.message);
    },
  });
}
