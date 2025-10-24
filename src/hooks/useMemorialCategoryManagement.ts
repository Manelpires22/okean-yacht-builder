import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// ============================================
// 4. CRIAR CATEGORIA VAZIA (PLACEHOLDER)
// ============================================
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      modelo,
      categoria,
    }: {
      modelo: string;
      categoria: string;
    }) => {
      const { data, error } = await supabase
        .from('memorial_okean')
        .insert({
          modelo,
          categoria,
          descricao_item: '[Categoria vazia - adicione itens]',
          tipo_item: 'Placeholder',
          quantidade: 0,
          is_customizable: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorial-okean'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
      toast.success(`Categoria "${variables.categoria}" criada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar categoria: ${error.message}`);
    },
  });
}

// ============================================
// 5. LISTAR CATEGORIAS GLOBAIS (ÚNICAS)
// ============================================
export function useGlobalMemorialCategories() {
  return useQuery({
    queryKey: ['memorial-categories-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_okean')
        .select('categoria, modelo, category_display_order');

      if (error) throw error;

      // Agrupar por categoria (global)
      const categoriesMap = new Map<
        string,
        {
          categoria: string;
          totalItems: number;
          modelCount: number;
          models: Array<{ modelo: string; itemCount: number }>;
          minDisplayOrder: number;
        }
      >();

      data.forEach((item) => {
        const categoria = item.categoria;
        
        if (categoriesMap.has(categoria)) {
          const existing = categoriesMap.get(categoria)!;
          existing.totalItems += 1;
          
          // Atualizar contagem de itens por modelo
          const modelEntry = existing.models.find(m => m.modelo === item.modelo);
          if (modelEntry) {
            modelEntry.itemCount += 1;
          } else {
            existing.models.push({ modelo: item.modelo, itemCount: 1 });
            existing.modelCount += 1;
          }
          
          // Manter o menor display_order encontrado
          const displayOrder = item.category_display_order ?? 999;
          if (displayOrder < existing.minDisplayOrder) {
            existing.minDisplayOrder = displayOrder;
          }
        } else {
          categoriesMap.set(categoria, {
            categoria,
            totalItems: 1,
            modelCount: 1,
            models: [{ modelo: item.modelo, itemCount: 1 }],
            minDisplayOrder: item.category_display_order ?? 999,
          });
        }
      });

      return Array.from(categoriesMap.values()).sort(
        (a, b) => a.minDisplayOrder - b.minDisplayOrder
      );
    },
  });
}

// ============================================
// 6. LISTAR CATEGORIAS POR MODELO (LEGACY)
// ============================================
export function useMemorialCategoriesWithCount(modelo?: string) {
  return useQuery({
    queryKey: ['memorial-categories-count', modelo],
    queryFn: async () => {
      let query = supabase
        .from('memorial_okean')
        .select('categoria, modelo, category_display_order');

      if (modelo) {
        query = query.eq('modelo', modelo);
      }

      const { data, error } = await query;
      if (error) throw error;

      const categoriesMap = new Map<
        string,
        {
          categoria: string;
          modelo: string;
          itemCount: number;
          displayOrder: number;
        }
      >();

      data.forEach((item) => {
        const key = `${item.modelo}-${item.categoria}`;
        if (categoriesMap.has(key)) {
          const existing = categoriesMap.get(key)!;
          existing.itemCount += 1;
        } else {
          categoriesMap.set(key, {
            categoria: item.categoria,
            modelo: item.modelo,
            itemCount: 1,
            displayOrder: item.category_display_order ?? 999,
          });
        }
      });

      return Array.from(categoriesMap.values()).sort(
        (a, b) => a.displayOrder - b.displayOrder
      );
    },
  });
}
