import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MemorialOkeanItem {
  id: number;
  modelo: string;
  categoria: string;
  descricao_item: string;
  tipo_item: string;
  quantidade?: number;
  is_customizable?: boolean;
  marca?: string;
  created_at?: string;
}

export interface CreateMemorialItemInput {
  modelo: string;
  categoria: string;
  descricao_item: string;
  tipo_item: string;
  quantidade?: number;
  is_customizable?: boolean;
  marca?: string;
}

export interface UpdateMemorialItemInput extends CreateMemorialItemInput {
  id: number;
}

export function useMemorialOkeanItems(modelo?: string, categoria?: string) {
  return useQuery({
    queryKey: ['memorial-okean', modelo, categoria],
    queryFn: async () => {
      let query = supabase
        .from('memorial_okean')
        .select('*')
        .order('id', { ascending: true });

      if (modelo && modelo !== 'Todos') {
        query = query.eq('modelo', modelo);
      }

      if (categoria && categoria !== 'Todas') {
        query = query.eq('categoria', categoria);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MemorialOkeanItem[];
    },
  });
}

export function useMemorialOkeanCategories() {
  return useQuery({
    queryKey: ['memorial-okean-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_okean')
        .select('categoria')
        .order('categoria');

      if (error) throw error;

      // Get unique categories
      const uniqueCategories = Array.from(
        new Set(data.map((item) => item.categoria))
      ).sort();

      return uniqueCategories;
    },
  });
}

export function useMemorialOkeanModelos() {
  return useQuery({
    queryKey: ['memorial-okean-modelos'],
    queryFn: async () => {
      // Use RPC to get DISTINCT models from database
      // This bypasses the 1000 record limit
      const { data, error } = await supabase.rpc('get_distinct_memorial_modelos');

      if (error) {
        console.error('RPC failed:', error);
        throw error;
      }

      // RPC returns array of objects { modelo: string }, extract the string values
      // Type assertion needed because Supabase doesn't auto-generate RPC types
      const modelos = ((data || []) as Array<{ modelo: string }>)
        .map((item) => item.modelo)
        .sort();
      
      console.log('🔍 [Memorial Modelos] Using RPC');
      console.log('🔍 [Memorial Modelos] Raw data:', data);
      console.log('🔍 [Memorial Modelos] Extracted models:', modelos);
      console.log('🔍 [Memorial Modelos] Count:', modelos.length);

      return modelos;
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useCreateMemorialItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMemorialItemInput) => {
      const { data, error } = await supabase
        .from('memorial_okean')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorial-okean'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-okean-categories'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-okean-modelos'] });
      toast.success("Item adicionado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar item: ${error.message}`);
    },
  });
}

export function useUpdateMemorialItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateMemorialItemInput) => {
      const { data, error } = await supabase
        .from('memorial_okean')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorial-okean'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-okean-categories'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-okean-modelos'] });
      toast.success("Item atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar item: ${error.message}`);
    },
  });
}

export function useDeleteMemorialItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('memorial_okean')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorial-okean'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-okean-modelos'] });
      toast.success("Item removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover item: ${error.message}`);
    },
  });
}
