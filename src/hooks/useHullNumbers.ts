import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface HullNumber {
  id: string;
  brand: string;
  yacht_model_id: string;
  hull_number: string;
  hull_entry_date: string;
  estimated_delivery_date: string;
  status: 'available' | 'reserved' | 'contracted';
  contract_id: string | null;
  created_at: string;
  updated_at: string;
  // Production milestones
  job_stop_1_date: string | null;
  job_stop_2_date: string | null;
  job_stop_3_date: string | null;
  job_stop_4_date: string | null;
  barco_aberto_date: string | null;
  fechamento_convesdeck_date: string | null;
  barco_fechado_date: string | null;
  teste_piscina_date: string | null;
  teste_mar_date: string | null;
  entrega_comercial_date: string | null;
  yacht_model?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface HullNumberInsert {
  brand?: string;
  yacht_model_id: string;
  hull_number: string;
  hull_entry_date: string;
  estimated_delivery_date: string;
  status?: 'available' | 'contracted';
  // Production milestones
  job_stop_1_date?: string | null;
  job_stop_2_date?: string | null;
  job_stop_3_date?: string | null;
  job_stop_4_date?: string | null;
  barco_aberto_date?: string | null;
  fechamento_convesdeck_date?: string | null;
  barco_fechado_date?: string | null;
  teste_piscina_date?: string | null;
  teste_mar_date?: string | null;
  entrega_comercial_date?: string | null;
}

export interface HullNumberUpdate extends Partial<HullNumberInsert> {
  id: string;
}

// Buscar todas as matrículas
export function useHullNumbers() {
  return useQuery({
    queryKey: ['hull-numbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hull_numbers')
        .select(`
          *,
          yacht_model:yacht_models(id, name, code)
        `)
        .order('yacht_model_id')
        .order('hull_number');

      if (error) throw error;
      return data as HullNumber[];
    },
  });
}

// Buscar matrículas disponíveis para um modelo específico
export function useAvailableHullNumbers(yachtModelId: string | null) {
  return useQuery({
    queryKey: ['hull-numbers', 'available', yachtModelId],
    queryFn: async () => {
      if (!yachtModelId) return [];

      const { data, error } = await supabase
        .from('hull_numbers')
        .select('*')
        .eq('yacht_model_id', yachtModelId)
        .eq('status', 'available')
        .order('hull_number');

      if (error) throw error;
      return data as HullNumber[];
    },
    enabled: !!yachtModelId,
  });
}

// Buscar uma matrícula específica
export function useHullNumber(hullNumberId: string | null) {
  return useQuery({
    queryKey: ['hull-numbers', hullNumberId],
    queryFn: async () => {
      if (!hullNumberId) return null;

      const { data, error } = await supabase
        .from('hull_numbers')
        .select(`
          *,
          yacht_model:yacht_models(id, name, code)
        `)
        .eq('id', hullNumberId)
        .single();

      if (error) throw error;
      return data as HullNumber;
    },
    enabled: !!hullNumberId,
  });
}

// Criar uma matrícula
export function useCreateHullNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HullNumberInsert) => {
      const { data: hullNumber, error } = await supabase
        .from('hull_numbers')
        .insert({
          brand: data.brand || 'OKEAN',
          yacht_model_id: data.yacht_model_id,
          hull_number: data.hull_number,
          hull_entry_date: data.hull_entry_date,
          estimated_delivery_date: data.estimated_delivery_date,
        })
        .select()
        .single();

      if (error) throw error;
      return hullNumber;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hull-numbers'] });
      toast({
        title: "Sucesso!",
        description: "Matrícula criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar matrícula",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Deletar uma matrícula
export function useDeleteHullNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hullNumberId: string) => {
      const { error } = await supabase
        .from('hull_numbers')
        .delete()
        .eq('id', hullNumberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hull-numbers'] });
      toast({
        title: "Sucesso!",
        description: "Matrícula deletada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar matrícula",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Atualizar uma matrícula
export function useUpdateHullNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: HullNumberUpdate) => {
      const { data: hullNumber, error } = await supabase
        .from('hull_numbers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return hullNumber;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hull-numbers'] });
      toast({
        title: "Sucesso!",
        description: "Matrícula atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar matrícula",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Importar matrículas em lote
export function useImportHullNumbers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: HullNumberInsert[]) => {
      const { data, error } = await supabase
        .from('hull_numbers')
        .insert(items.map(item => ({
          brand: item.brand || 'OKEAN',
          yacht_model_id: item.yacht_model_id,
          hull_number: item.hull_number,
          hull_entry_date: item.hull_entry_date,
          estimated_delivery_date: item.estimated_delivery_date,
          status: item.status || 'available',
          job_stop_1_date: item.job_stop_1_date || null,
          job_stop_2_date: item.job_stop_2_date || null,
          job_stop_3_date: item.job_stop_3_date || null,
          job_stop_4_date: item.job_stop_4_date || null,
          barco_aberto_date: item.barco_aberto_date || null,
          fechamento_convesdeck_date: item.fechamento_convesdeck_date || null,
          barco_fechado_date: item.barco_fechado_date || null,
          teste_piscina_date: item.teste_piscina_date || null,
          teste_mar_date: item.teste_mar_date || null,
          entrega_comercial_date: item.entrega_comercial_date || null,
        })))
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hull-numbers'] });
      toast({
        title: "Sucesso!",
        description: `${data.length} matrículas importadas com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao importar matrículas",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Upsert matrículas (insert or update) - para merge do Plano Mestre
export function useUpsertHullNumbers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: HullNumberInsert[]) => {
      // Para cada item, verificar se já existe e fazer update ou insert
      const results = {
        inserted: 0,
        updated: 0,
        errors: [] as string[],
      };

      for (const item of items) {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('hull_numbers')
          .select('id')
          .eq('hull_number', item.hull_number)
          .maybeSingle();

        if (existing) {
          // Update
          const { error } = await supabase
            .from('hull_numbers')
            .update({
              brand: item.brand,
              yacht_model_id: item.yacht_model_id,
              hull_entry_date: item.hull_entry_date,
              estimated_delivery_date: item.estimated_delivery_date,
              status: item.status,
              job_stop_1_date: item.job_stop_1_date,
              job_stop_2_date: item.job_stop_2_date,
              job_stop_3_date: item.job_stop_3_date,
              job_stop_4_date: item.job_stop_4_date,
              barco_aberto_date: item.barco_aberto_date,
              fechamento_convesdeck_date: item.fechamento_convesdeck_date,
              barco_fechado_date: item.barco_fechado_date,
              teste_piscina_date: item.teste_piscina_date,
              teste_mar_date: item.teste_mar_date,
              entrega_comercial_date: item.entrega_comercial_date,
            })
            .eq('id', existing.id);

          if (error) {
            results.errors.push(`${item.hull_number}: ${error.message}`);
          } else {
            results.updated++;
          }
        } else {
          // Insert
          const { error } = await supabase
            .from('hull_numbers')
            .insert({
              brand: item.brand || 'OKEAN',
              yacht_model_id: item.yacht_model_id,
              hull_number: item.hull_number,
              hull_entry_date: item.hull_entry_date,
              estimated_delivery_date: item.estimated_delivery_date,
              status: item.status || 'available',
              job_stop_1_date: item.job_stop_1_date || null,
              job_stop_2_date: item.job_stop_2_date || null,
              job_stop_3_date: item.job_stop_3_date || null,
              job_stop_4_date: item.job_stop_4_date || null,
              barco_aberto_date: item.barco_aberto_date || null,
              fechamento_convesdeck_date: item.fechamento_convesdeck_date || null,
              barco_fechado_date: item.barco_fechado_date || null,
              teste_piscina_date: item.teste_piscina_date || null,
              teste_mar_date: item.teste_mar_date || null,
              entrega_comercial_date: item.entrega_comercial_date || null,
            });

          if (error) {
            results.errors.push(`${item.hull_number}: ${error.message}`);
          } else {
            results.inserted++;
          }
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['hull-numbers'] });
      
      const messages: string[] = [];
      if (results.inserted > 0) messages.push(`${results.inserted} novas matrículas`);
      if (results.updated > 0) messages.push(`${results.updated} atualizadas`);
      
      toast({
        title: "Importação concluída!",
        description: messages.join(', ') + '.',
      });

      if (results.errors.length > 0) {
        toast({
          title: "Alguns erros ocorreram",
          description: results.errors.slice(0, 3).join('; '),
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Reset seguro: deletar matrículas não contratadas
export function useResetUncontractedHullNumbers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Primeiro, contar quantas serão deletadas para feedback
      const { count: countToDelete } = await supabase
        .from('hull_numbers')
        .select('*', { count: 'exact', head: true })
        .is('contract_id', null);

      const { count: countContracted } = await supabase
        .from('hull_numbers')
        .select('*', { count: 'exact', head: true })
        .not('contract_id', 'is', null);

      // Deletar apenas as que não têm contrato
      const { error } = await supabase
        .from('hull_numbers')
        .delete()
        .is('contract_id', null);

      if (error) throw error;

      return {
        deleted: countToDelete || 0,
        preserved: countContracted || 0,
      };
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['hull-numbers'] });
      toast({
        title: "Reset concluído!",
        description: `${results.deleted} matrículas deletadas. ${results.preserved} matrículas contratadas preservadas.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resetar matrículas",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
