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
    mutationFn: async (params: {
      atoId: string;
      stepId: string;
      stepType: 'pm_review' | 'supply_quote' | 'planning_validation' | 'pm_final';
      action: 'advance' | 'reject';
      data: any;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Atualizar o step atual
      const { error: stepError } = await supabase
        .from('ato_workflow_steps')
        .update({
          status: params.action === 'reject' ? 'rejected' : 'completed',
          response_data: params.data,
          notes: params.data.notes,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.stepId);

      if (stepError) throw stepError;

      // 2. Determinar próximo step ou status final
      const stepOrder = ['pm_review', 'supply_quote', 'planning_validation', 'pm_final'];
      const currentIndex = stepOrder.indexOf(params.stepType);
      
      let newWorkflowStatus: string;
      let atoStatus: string | null = null;

      if (params.action === 'reject') {
        // Se rejeitado, workflow termina
        newWorkflowStatus = 'rejected';
        atoStatus = 'rejected';
      } else if (currentIndex === stepOrder.length - 1) {
        // Se é o último step e foi aprovado, workflow completo
        newWorkflowStatus = 'completed';
        atoStatus = 'approved';
      } else {
        // Avançar para próximo step
        const nextStepType = stepOrder[currentIndex + 1];
        newWorkflowStatus = `pending_${nextStepType.replace('_', '_')}`;
        
        // Criar próximo step (atribuir ao PM ou deixar null para outros)
        const { error: nextStepError } = await supabase
          .from('ato_workflow_steps')
          .insert({
            ato_id: params.atoId,
            step_type: nextStepType,
            status: 'pending',
            assigned_to: nextStepType.includes('pm') ? (await supabase
              .from('additional_to_orders')
              .select('contract:contracts(yacht_model_id)')
              .eq('id', params.atoId)
              .single()
              .then(async ({ data }) => {
                const { data: pm } = await supabase
                  .from('pm_yacht_model_assignments')
                  .select('pm_user_id')
                  .eq('yacht_model_id', data?.contract?.yacht_model_id)
                  .single();
                return pm?.pm_user_id || null;
              })
            ) : null,
          });

        if (nextStepError) throw nextStepError;
      }

      // 3. Atualizar ATO com novo workflow_status
      const updateData: any = {
        workflow_status: newWorkflowStatus,
        updated_at: new Date().toISOString(),
      };

      // Atualizar dados específicos de cada step na ATO
      if (params.stepType === 'pm_review') {
        updateData.notes = params.data.pm_scope || updateData.notes;
      } else if (params.stepType === 'supply_quote') {
        updateData.price_impact = params.data.supply_cost || updateData.price_impact;
      } else if (params.stepType === 'planning_validation') {
        updateData.delivery_days_impact = params.data.planning_delivery_impact_days || updateData.delivery_days_impact;
      } else if (params.stepType === 'pm_final') {
        updateData.price_impact = params.data.pm_final_price || updateData.price_impact;
        updateData.delivery_days_impact = params.data.pm_final_delivery_impact_days || updateData.delivery_days_impact;
      }

      if (atoStatus) {
        updateData.status = atoStatus;
        if (atoStatus === 'approved') {
          updateData.approved_at = new Date().toISOString();
          updateData.approved_by = user.id;
        }
      }

      const { error: atoError } = await supabase
        .from('additional_to_orders')
        .update(updateData)
        .eq('id', params.atoId);

      if (atoError) throw atoError;

      return { 
        success: true, 
        workflowCompleted: newWorkflowStatus === 'completed' || newWorkflowStatus === 'rejected',
        finalStatus: atoStatus 
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ato-workflow', variables.atoId] });
      queryClient.invalidateQueries({ queryKey: ['atos'] });
      queryClient.invalidateQueries({ queryKey: ['ato', variables.atoId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
      
      if (data.workflowCompleted) {
        if (data.finalStatus === 'approved') {
          toast.success('ATO aprovada!', {
            description: 'Workflow técnico concluído com sucesso.',
          });
        } else {
          toast.info('ATO rejeitada', {
            description: 'Workflow técnico foi rejeitado.',
          });
        }
      } else {
        toast.success('Etapa concluída!', {
          description: 'Workflow avançado para próxima etapa.',
        });
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao avançar workflow', {
        description: error.message,
      });
    },
  });
}

export function useATOWorkflowTasks(userId: string | undefined) {
  return useQuery({
    queryKey: ['ato-workflow-tasks', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('ato_workflow_steps')
        .select(`
          *,
          ato:additional_to_orders(
            id,
            ato_number,
            title,
            contract:contracts(contract_number, client_id)
          )
        `)
        .eq('assigned_to', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
