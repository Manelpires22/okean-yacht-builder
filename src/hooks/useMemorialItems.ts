import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMemorialItems(yachtModelId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['memorial-items', yachtModelId],
    queryFn: async () => {
      let query = supabase
        .from('memorial_items')
        .select('*')
        .order('category_display_order')
        .order('display_order');

      if (yachtModelId) {
        query = query.eq('yacht_model_id', yachtModelId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
