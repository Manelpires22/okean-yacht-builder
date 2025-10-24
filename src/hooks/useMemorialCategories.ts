import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MemorialCategory } from "@/types/memorial";

export function useMemorialCategories() {
  return useQuery<MemorialCategory[]>({
    queryKey: ['memorial-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_categories')
        .select('*')
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
        supabase
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

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<MemorialCategory>) => {
      const { data: category, error } = await (supabase as any)
        .from('memorial_categories')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      toast({
        title: "Categoria criada",
        description: "Nova categoria adicionada com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MemorialCategory> }) => {
      const { error } = await (supabase as any)
        .from('memorial_categories')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Categoria atualizada",
        description: "Alterações salvas com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-items'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('memorial_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Categoria deletada",
        description: "Categoria removida com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
