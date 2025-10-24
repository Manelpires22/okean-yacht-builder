import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CategoryOrder {
  categoria: string;
  order: number;
}

export function useUpdateCategoryOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      modelo, 
      categoriesOrder 
    }: { 
      modelo: string; 
      categoriesOrder: CategoryOrder[];
    }) => {
      const { error } = await supabase.rpc('update_memorial_category_orders', {
        p_modelo: modelo,
        p_orders: categoriesOrder as any
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorial-okean'] });
      toast.success("Ordem das categorias atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar ordem: ${error.message}`);
    },
  });
}
