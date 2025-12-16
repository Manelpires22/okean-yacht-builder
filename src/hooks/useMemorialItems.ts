import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MemorialItem } from "@/types/memorial";

export function useMemorialItems(yachtModelId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery<MemorialItem[]>({
    queryKey: ['memorial-items', yachtModelId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('memorial_items')
        .select(`
          *,
          category:memorial_categories(
            id,
            value,
            label,
            display_order
          ),
          job_stop:job_stops!memorial_items_job_stop_id_fkey(
            id,
            stage,
            days_limit,
            item_name
          )
        `)
        .order('category_display_order')
        .order('display_order');

      if (yachtModelId) {
        query = query.eq('yacht_model_id', yachtModelId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MemorialItem[];
    },
    enabled: !!yachtModelId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('memorial_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Item deletado",
        description: "O item foi removido do memorial descritivo",
      });
      queryClient.invalidateQueries({ queryKey: ['memorial-items'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    ...query,
    deleteItem: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
