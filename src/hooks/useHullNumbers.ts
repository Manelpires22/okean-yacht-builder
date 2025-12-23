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
  yacht_model?: {
    id: string;
    name: string;
    code: string;
  };
}

interface HullNumberInsert {
  brand?: string;
  yacht_model_id: string;
  hull_number: string;
  hull_entry_date: string;
  estimated_delivery_date: string;
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
