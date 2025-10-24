import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============================================
// 1. RENOMEAR CATEGORIA
// ============================================
export function useRenameCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      modelo,
      oldName,
      newName,
    }: {
      modelo: string;
      oldName: string;
      newName: string;
    }) => {
      const { data, error } = await supabase.rpc('rename_memorial_category', {
        p_modelo: modelo,
        p_old_name: oldName,
        p_new_name: newName,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (affectedRows, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorial-okean'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
      toast.success(
        `Categoria renomeada! ${affectedRows} ${
          affectedRows === 1 ? 'item atualizado' : 'itens atualizados'
        }.`
      );
    },
    onError: (error: Error) => {
      if (error.message.includes('já existe')) {
        toast.error('Esta categoria já existe! Escolha outro nome ou use "Mesclar".');
      } else {
        toast.error(`Erro ao renomear: ${error.message}`);
      }
    },
  });
}

// ============================================
// 2. MESCLAR CATEGORIAS
// ============================================
export function useMergeCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      modelo,
      sourceCategory,
      targetCategory,
    }: {
      modelo: string;
      sourceCategory: string;
      targetCategory: string;
    }) => {
      const { data, error } = await supabase.rpc('merge_memorial_categories', {
        p_modelo: modelo,
        p_source_category: sourceCategory,
        p_target_category: targetCategory,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (movedItems, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorial-okean'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
      toast.success(
        `${movedItems} ${movedItems === 1 ? 'item movido' : 'itens movidos'} de "${variables.sourceCategory}" para "${variables.targetCategory}".`
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao mesclar: ${error.message}`);
    },
  });
}

// ============================================
// 3. DELETAR CATEGORIA VAZIA
// ============================================
export function useDeleteEmptyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      modelo,
      categoria,
    }: {
      modelo: string;
      categoria: string;
    }) => {
      const { data, error } = await supabase.rpc('delete_empty_memorial_category', {
        p_modelo: modelo,
        p_categoria: categoria,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorial-okean'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
      toast.success(`Categoria "${variables.categoria}" removida!`);
    },
    onError: (error: Error) => {
      if (error.message.includes('possui')) {
        toast.error('Esta categoria possui itens. Use "Mesclar" para movê-los antes de deletar.');
      } else {
        toast.error(`Erro ao deletar: ${error.message}`);
      }
    },
  });
}
