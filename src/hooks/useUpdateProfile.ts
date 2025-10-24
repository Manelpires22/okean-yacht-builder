import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateProfileData {
  full_name?: string;
  department?: string;
  email?: string;
}

interface ChangePasswordData {
  newPassword: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Atualizar email no auth.users se fornecido
      if (data.email && data.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email
        });
        if (authError) throw authError;
      }

      // Atualizar full_name e department em public.users
      if (data.full_name || data.department) {
        const updateData: any = {};
        if (data.full_name) updateData.full_name = data.full_name;
        if (data.department) updateData.department = data.department;

        const { error: userError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (userError) throw userError;
      }

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      if (variables.email) {
        toast.success("Perfil atualizado! Verifique seu email para confirmar o novo endereço.");
      } else {
        toast.success("Perfil atualizado com sucesso!");
      }
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar perfil", {
        description: error.message
      });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async ({ newPassword }: ChangePasswordData) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar senha", {
        description: error.message
      });
    },
  });
};
