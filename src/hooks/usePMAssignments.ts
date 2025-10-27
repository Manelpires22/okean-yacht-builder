import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PMAssignment {
  id: string;
  pm_user_id: string;
  yacht_model_id: string;
  assigned_at: string;
  pm_user?: {
    id: string;
    full_name: string;
    email: string;
  };
  yacht_model?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface AssignPMToModelInput {
  pm_user_id: string;
  yacht_model_id: string;
}

export function usePMAssignments() {
  return useQuery({
    queryKey: ['pm-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pm_yacht_model_assignments')
        .select(`
          *,
          pm_user:users!pm_user_id(id, full_name, email),
          yacht_model:yacht_models(id, name, code)
        `)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as PMAssignment[];
    }
  });
}

export function useAssignPMToModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AssignPMToModelInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('pm_yacht_model_assignments')
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
      queryClient.invalidateQueries({ queryKey: ['pm-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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
        .from('pm_yacht_model_assignments')
        .delete()
        .eq('yacht_model_id', yacht_model_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('PM removido do modelo!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover PM', {
        description: error.message
      });
    }
  });
}

export function usePMUsers() {
  return useQuery({
    queryKey: ['pm-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          department,
          user_roles!inner(role)
        `)
        .eq('user_roles.role', 'pm_engenharia')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });
}
