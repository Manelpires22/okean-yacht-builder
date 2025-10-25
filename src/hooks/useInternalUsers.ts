import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DepartmentType = 'commercial' | 'engineering' | 'supply' | 'planning' | 'backoffice';

export interface InternalUser {
  id: string;
  user_id: string;
  department: DepartmentType;
  role_specialty: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  pm_assignments?: Array<{
    yacht_model: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

export interface CreateInternalUserInput {
  user_id: string;
  department: DepartmentType;
  role_specialty: string;
}

export interface AssignPMToModelInput {
  pm_user_id: string;
  yacht_model_id: string;
}

export function useInternalUsers() {
  return useQuery({
    queryKey: ['internal-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_users' as any)
        .select(`
          *,
          user:users!user_id(id, full_name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as InternalUser[];
    }
  });
}

export function usePMAssignments() {
  return useQuery({
    queryKey: ['pm-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pm_yacht_model_assignments' as any)
        .select(`
          *,
          pm_user:users!pm_user_id(id, full_name, email),
          yacht_model:yacht_models(id, name, code)
        `)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateInternalUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateInternalUserInput) => {
      const { data, error } = await supabase
        .from('internal_users' as any)
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-users'] });
      toast.success('Usuário interno criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar usuário interno', {
        description: error.message
      });
    }
  });
}

export function useUpdateInternalUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<InternalUser> & { id: string }) => {
      const { data, error } = await supabase
        .from('internal_users' as any)
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-users'] });
      toast.success('Usuário interno atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar usuário interno', {
        description: error.message
      });
    }
  });
}

export function useAssignPMToModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AssignPMToModelInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('pm_yacht_model_assignments' as any)
        .insert({
          pm_user_id: input.pm_user_id,
          yacht_model_id: input.yacht_model_id,
          assigned_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-users'] });
      queryClient.invalidateQueries({ queryKey: ['pm-assignments'] });
      toast.success('PM atribuído ao modelo com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atribuir PM', {
        description: error.message
      });
    }
  });
}

export function useUnassignPMFromModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (yacht_model_id: string) => {
      const { error } = await supabase
        .from('pm_yacht_model_assignments' as any)
        .delete()
        .eq('yacht_model_id', yacht_model_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-assignments'] });
      toast.success('PM removido do modelo!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover PM', {
        description: error.message
      });
    }
  });
}
