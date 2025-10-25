import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WorkflowStep {
  id: string;
  step_type: 'pm_initial' | 'supply_quote' | 'planning_check' | 'pm_final';
  status: 'pending' | 'completed' | 'skipped' | 'rejected';
  assigned_to: string | null;
  response_data: any;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  assigned_user?: {
    full_name: string;
    email: string;
  };
}

export interface CustomizationWorkflow {
  id: string;
  item_name: string;
  workflow_status: string;
  pm_scope: string | null;
  engineering_hours: number;
  required_parts: any[];
  supply_items: any[];
  supply_cost: number;
  supply_lead_time_days: number;
  supply_notes: string | null;
  planning_window_start: string | null;
  planning_delivery_impact_days: number;
  planning_notes: string | null;
  pm_final_price: number;
  pm_final_delivery_impact_days: number;
  pm_final_notes: string | null;
  reject_reason: string | null;
  quotations: {
    quotation_number: string;
    client_name: string;
    base_price: number;
    total_options_price: number;
    base_delivery_days: number;
    yacht_models: {
      name: string;
      code: string;
    };
  };
  workflow_steps: WorkflowStep[];
}

export function useCustomizationWorkflow(customizationId: string | null) {
  return useQuery({
    queryKey: ['customization-workflow', customizationId],
    queryFn: async () => {
      if (!customizationId) return null;

      const { data, error } = await supabase
        .from('quotation_customizations')
        .select(`
          *,
          quotations (
            quotation_number,
            client_name,
            base_price,
            total_options_price,
            base_delivery_days,
            yacht_models (name, code)
          ),
          workflow_steps:customization_workflow_steps (
            id,
            step_type,
            status,
            assigned_to,
            response_data,
            notes,
            completed_at,
            created_at,
            assigned_user:users (full_name, email)
          )
        `)
        .eq('id', customizationId)
        .order('created_at', { 
          foreignTable: 'customization_workflow_steps',
          ascending: true 
        })
        .single();

      if (error) throw error;
      return data as CustomizationWorkflow;
    },
    enabled: !!customizationId,
  });
}

export function useAdvanceCustomizationWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      customizationId: string;
      currentStep: 'pm_initial' | 'supply_quote' | 'planning_check' | 'pm_final';
      action: 'advance' | 'reject';
      data: any;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'advance-customization-workflow',
        { body: params }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customization-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['customizations'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });

      if (data.needsCommercialApproval) {
        toast.success('Customização aprovada!', {
          description: 'Uma aprovação comercial foi criada automaticamente.',
        });
      } else {
        toast.success(data.message || 'Workflow avançado com sucesso!');
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao avançar workflow', {
        description: error.message,
      });
    },
  });
}

export function useWorkflowConfig() {
  return useQuery({
    queryKey: ['workflow-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_config')
        .select('*');

      if (error) throw error;

      const config: Record<string, any> = {};
      data.forEach((item) => {
        config[item.config_key] = item.config_value;
      });

      return {
        engineeringRate: config.engineering_rate?.rate_per_hour || 150,
        contingencyPercent: config.contingency_percent?.percent || 10,
        slaDays: config.sla_days || {
          pm_initial: 2,
          supply_quote: 5,
          planning_check: 2,
          pm_final: 1,
        },
      };
    },
  });
}
