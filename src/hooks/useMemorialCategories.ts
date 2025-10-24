import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MemorialCategory } from "@/types/memorial";

export function useMemorialCategories() {
  return useQuery<MemorialCategory[]>({
    queryKey: ['memorial-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('memorial_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as MemorialCategory[];
    },
  });
}

export function useUpdateCategoryOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categories: { id: string; display_order: number }[]) => {
      const promises = categories.map(cat =>
        (supabase as any)
          .from('memorial_categories')
          .update({ display_order: cat.display_order })
          .eq('id', cat.id)
      );
      
      const results = await Promise.all(promises);
      
      // Check for errors
      const error = results.find((r: any) => r.error);
      if (error?.error) throw error.error;
    },
    onSuccess: () => {
      toast({ 
        title: "Ordem atualizada",
        description: "A ordenação das categorias foi salva com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-items'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar ordem",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
