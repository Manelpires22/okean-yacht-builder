import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryStats {
  category_id: string;
  item_count: number;
  model_ids: string[];
  model_names: string[];
}

export function useMemorialCategoryStats() {
  return useQuery<CategoryStats[]>({
    queryKey: ['memorial-category-stats'],
    queryFn: async () => {
      // Buscar todos os itens com suas categorias e modelos
      const { data: items, error } = await (supabase as any)
        .from('memorial_items')
        .select(`
          category_id,
          yacht_model_id,
          yacht_model:yacht_models(id, name)
        `);
      
      if (error) throw error;

      // Agrupar por categoria
      const statsMap = new Map<string, CategoryStats>();

      items?.forEach((item: any) => {
        const categoryId = item.category_id;
        if (!categoryId) return;

        if (!statsMap.has(categoryId)) {
          statsMap.set(categoryId, {
            category_id: categoryId,
            item_count: 0,
            model_ids: [],
            model_names: [],
          });
        }

        const stats = statsMap.get(categoryId)!;
        stats.item_count++;

        // Adicionar modelo se não for duplicado
        if (item.yacht_model_id && !stats.model_ids.includes(item.yacht_model_id)) {
          stats.model_ids.push(item.yacht_model_id);
          if (item.yacht_model?.name) {
            stats.model_names.push(item.yacht_model.name);
          }
        }
      });

      return Array.from(statsMap.values());
    },
  });
}
