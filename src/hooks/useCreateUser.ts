import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  department: string;
  roles: string[];
  is_active: boolean;
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Não autenticado");
      }

      const { data, error } = await supabase.functions.invoke("create-user", {
        body: userData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar utilizador");
      }

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Utilizador criado",
        description: "O utilizador foi criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar utilizador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
