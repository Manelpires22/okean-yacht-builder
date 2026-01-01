import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Sessão não encontrada");
      }

      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Erro ao excluir utilizador");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Utilizador excluído", {
        description: "O utilizador foi removido permanentemente do sistema.",
      });
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir utilizador", {
        description: error.message,
      });
    },
  });
};
