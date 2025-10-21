import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpdateUserData {
  user_id: string;
  full_name: string;
  department: string;
  roles: string[];
  is_active: boolean;
  new_password?: string;
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: UpdateUserData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Não autenticado");
      }

      const { data, error } = await supabase.functions.invoke("update-user", {
        body: userData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Erro ao atualizar utilizador");
      }

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Utilizador atualizado",
        description: "As alterações foram guardadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar utilizador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
