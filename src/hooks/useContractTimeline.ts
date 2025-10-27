import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: "contract_created" | "ato_created" | "ato_approved" | "ato_rejected" | "ato_cancelled" | "contract_updated" | "status_changed";
  title: string;
  description: string;
  user_name: string | null;
  user_email: string | null;
  metadata?: any;
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

      // Buscar ATOs do contrato
      const { data: atos, error: atosError } = await supabase
        .from("additional_to_orders")
        .select("*")
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
      atos?.forEach((ato) => {
        // Criação da ATO
        timeline.push({
          id: `ato-created-${ato.id}`,
          timestamp: ato.requested_at,
          event_type: "ato_created",
          title: `ATO ${ato.ato_number} Criada`,
          description: ato.title,
          user_name: null,
          user_email: null,
          metadata: ato,
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
