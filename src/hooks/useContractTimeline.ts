import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: 
    | "contract_created" 
    | "ato_created" 
    | "ato_approved" 
    | "ato_rejected" 
    | "ato_cancelled" 
    | "contract_updated" 
    | "status_changed"
    | "ato_workflow_pm_review"
    | "ato_workflow_supply_quote"
    | "ato_workflow_planning"
    | "ato_workflow_client_approval";
  title: string;
  description: string;
  user_name: string | null;
  user_email: string | null;
  metadata?: any;
  workflowStatus?: {
    status: string;
    assignedTo?: string;
    stepType?: string;
  };
}

export function useContractTimeline(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract-timeline", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      // Buscar logs de auditoria relacionados ao contrato
      const { data: auditLogs, error: auditError } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("table_name", "contracts")
        .eq("record_id", contractId)
        .order("created_at", { ascending: false });

      if (auditError) throw auditError;

      // Buscar ATOs do contrato com workflow steps
      const { data: atos, error: atosError } = await supabase
        .from("additional_to_orders")
        .select(`
          *,
          workflow_steps:ato_workflow_steps(
            id,
            step_type,
            status,
            completed_at,
            notes,
            response_data,
            assigned_to,
            assigned_user:users!ato_workflow_steps_assigned_to_fkey(full_name, email)
          )
        `)
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      if (atosError) throw atosError;

      // Construir timeline unificada
      const timeline: TimelineEvent[] = [];

      // Adicionar eventos de auditoria
      auditLogs?.forEach((log) => {
        if (log.action === "INSERT") {
          timeline.push({
            id: log.id,
            timestamp: log.created_at,
            event_type: "contract_created",
            title: "Contrato Criado",
            description: `Contrato criado a partir da cotação aceita`,
            user_name: log.user_name,
            user_email: log.user_email,
            metadata: log.new_values,
          });
        } else if (log.action === "UPDATE") {
          const oldValues = log.old_values as any;
          const newValues = log.new_values as any;
          const oldStatus = oldValues?.status;
          const newStatus = newValues?.status;
          
          if (oldStatus !== newStatus && oldStatus && newStatus) {
            timeline.push({
              id: log.id,
              timestamp: log.created_at,
              event_type: "status_changed",
              title: "Status Alterado",
              description: `Status mudou de "${oldStatus}" para "${newStatus}"`,
              user_name: log.user_name,
              user_email: log.user_email,
              metadata: { oldStatus, newStatus },
            });
          } else {
            timeline.push({
              id: log.id,
              timestamp: log.created_at,
              event_type: "contract_updated",
              title: "Contrato Atualizado",
              description: `Campos alterados: ${log.changed_fields?.join(", ") || "N/A"}`,
              user_name: log.user_name,
              user_email: log.user_email,
              metadata: newValues,
            });
          }
        }
      });

      // Adicionar eventos de ATOs
      atos?.forEach((ato: any) => {
        const workflowSteps = ato.workflow_steps || [];
        const currentStep = workflowSteps.find((s: any) => s.status === 'pending');
        
        // Determinar descrição baseada no status
        let description = ato.title;
        let workflowStatus = undefined;
        
        if (ato.workflow_status && ato.workflow_status !== 'completed') {
          const stepLabels: Record<string, string> = {
            'pending_pm_review': 'Aguardando Revisão do PM',
            'pending_supply_quote': 'Aguardando Cotação de Suprimentos',
            'pending_planning': 'Aguardando Validação do Planejamento',
            'pending_client_approval': 'Aguardando Aprovação do Cliente',
          };
          
          const statusLabel = stepLabels[ato.workflow_status] || ato.workflow_status;
          const assignedName = currentStep?.assigned_user?.full_name || 'Não atribuído';
          
          description = `${ato.title}\n⏳ ${statusLabel} (${assignedName})`;
          
          workflowStatus = {
            status: ato.workflow_status,
            assignedTo: assignedName,
            stepType: currentStep?.step_type,
          };
        }
        
        // Criação da ATO
        timeline.push({
          id: `ato-created-${ato.id}`,
          timestamp: ato.requested_at,
          event_type: "ato_created",
          title: `ATO ${ato.ato_number} Criada`,
          description,
          user_name: null,
          user_email: null,
          metadata: ato,
          workflowStatus,
        });
        
        // Adicionar eventos para workflow steps completados
        workflowSteps
          .filter((step: any) => step.status === 'completed' && step.completed_at)
          .forEach((step: any) => {
            const stepEventTypes: Record<string, any> = {
              'pm_review': {
                type: 'ato_workflow_pm_review',
                title: `ATO ${ato.ato_number} - Revisão PM Completa`,
              },
              'supply_quote': {
                type: 'ato_workflow_supply_quote',
                title: `ATO ${ato.ato_number} - Cotação de Suprimentos Completa`,
              },
              'planning_validation': {
                type: 'ato_workflow_planning',
                title: `ATO ${ato.ato_number} - Validação de Planejamento Completa`,
              },
              'client_approval': {
                type: 'ato_workflow_client_approval',
                title: `ATO ${ato.ato_number} - Aprovação do Cliente`,
              },
            };
            
            const eventInfo = stepEventTypes[step.step_type];
            if (eventInfo) {
              timeline.push({
                id: `ato-workflow-${ato.id}-${step.id}`,
                timestamp: step.completed_at,
                event_type: eventInfo.type,
                title: eventInfo.title,
                description: step.notes || `Step ${step.step_type} concluído`,
                user_name: step.assigned_user?.full_name || null,
                user_email: step.assigned_user?.email || null,
                metadata: { ato, step, response_data: step.response_data },
              });
            }
          });

        // Aprovação da ATO
        if (ato.status === "approved" && ato.approved_at) {
          timeline.push({
            id: `ato-approved-${ato.id}`,
            timestamp: ato.approved_at,
            event_type: "ato_approved",
            title: `ATO ${ato.ato_number} Aprovada`,
            description: `Impacto: R$ ${ato.price_impact.toFixed(2)} e ${ato.delivery_days_impact} dias`,
            user_name: null,
            user_email: null,
            metadata: ato,
          });
        }

        // Rejeição da ATO
        if (ato.status === "rejected") {
          timeline.push({
            id: `ato-rejected-${ato.id}`,
            timestamp: ato.updated_at,
            event_type: "ato_rejected",
            title: `ATO ${ato.ato_number} Rejeitada`,
            description: ato.rejection_reason || "Sem motivo especificado",
            user_name: null,
            user_email: null,
            metadata: ato,
          });
        }

        // Cancelamento da ATO
        if (ato.status === "cancelled") {
          timeline.push({
            id: `ato-cancelled-${ato.id}`,
            timestamp: ato.updated_at,
            event_type: "ato_cancelled",
            title: `ATO ${ato.ato_number} Cancelada`,
            description: "ATO foi cancelada",
            user_name: null,
            user_email: null,
            metadata: ato,
          });
        }
      });

      // Ordenar por timestamp descendente (mais recente primeiro)
      timeline.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return timeline;
    },
    enabled: !!contractId,
  });
}
