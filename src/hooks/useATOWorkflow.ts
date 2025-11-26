import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ATOWorkflowStep {
  id: string;
  step_type: 'pm_review' | 'supply_quote' | 'planning_validation' | 'pm_final';
  status: 'pending' | 'completed' | 'skipped' | 'rejected';
  assigned_to: string | null;
  response_data: any;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: {
    full_name: string;
    email: string;
  };
}

export interface ATOWorkflow {
  id: string;
  ato_number: string;
  title: string;
  description: string | null;
  workflow_status: string | null;
  price_impact: number;
  delivery_days_impact: number;
  notes: string | null;
  contract: {
    contract_number: string;
    yacht_model_id: string;
  };
  workflow_steps: ATOWorkflowStep[];
}

export function useATOWorkflow(atoId: string | undefined) {
  return useQuery({
    queryKey: ['ato-workflow', atoId],
    queryFn: async () => {
      if (!atoId) return null;

      const { data, error } = await supabase
        .from('additional_to_orders')
        .select(`
          *,
          contract:contracts(contract_number, yacht_model_id),
          workflow_steps:ato_workflow_steps(
            id,
            step_type,
            status,
            assigned_to,
            response_data,
            notes,
            completed_at,
            created_at,
            updated_at,
            assigned_user:users(full_name, email)
          )
        `)
        .eq('id', atoId)
        .order('created_at', { 
          foreignTable: 'ato_workflow_steps',
          ascending: true 
        })
        .single();

      if (error) throw error;
      return data as ATOWorkflow;
    },
    enabled: !!atoId,
  });
}

export function useAdvanceATOWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      atoId,
      stepId,
      stepType,
      action,
      data,
    }: {
      atoId: string;
      stepId: string;
      stepType: string;
      action: 'advance' | 'reject';
      data: any;
    }) => {
      // Chamar edge function simplificada
      const { data: result, error } = await supabase.functions.invoke('advance-ato-workflow', {
        body: {
          atoId,
          stepId,
          stepType,
          action,
          data,
        },
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ato-workflow', variables.atoId] });
      queryClient.invalidateQueries({ queryKey: ['atos'] });
      queryClient.invalidateQueries({ queryKey: ['ato', variables.atoId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      
      if (data?.workflowCompleted) {
        toast.success('ATO aprovada com sucesso!', {
          description: 'Valores foram atualizados no contrato.',
        });
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao processar ATO', {
        description: error.message,
      });
    },
  });
}

export function useATOWorkflowTasks(userId: string | undefined, showAll = false) {
  return useQuery({
    queryKey: ['ato-workflow-tasks', userId, showAll],
    queryFn: async () => {
      if (!userId && !showAll) return [];

      let query = supabase
        .from('ato_workflow_steps')
        .select(`
          *,
          ato:additional_to_orders(
            id,
            ato_number,
            title,
            contract:contracts(contract_number, client_id)
          ),
          assigned_user:users(full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      // Se não for showAll, filtra por usuário específico
      if (!showAll && userId) {
        query = query.eq('assigned_to', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!userId || showAll,
  });
}
