import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Material {
  name: string;
  unitCost: number;
  quantity: number;
  total: number;
}

interface ApproveATOItemParams {
  configId: string;
  atoId: string;
  approved: boolean;
  deliveryImpactDays?: number;
  notes?: string;
  // Campos para customizações
  materials?: Material[];
  laborHours?: number;
  laborCostPerHour?: number;
  calculatedPrice?: number;
}

export function useApproveATOItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      configId,
      atoId,
      approved,
      deliveryImpactDays = 0,
      notes,
      materials,
      laborHours,
      laborCostPerHour,
      calculatedPrice,
    }: ApproveATOItemParams) => {
      const updateData: Record<string, any> = {
        pm_status: approved ? "approved" : "rejected",
        pm_notes: notes,
        pm_reviewed_by: user?.id,
        pm_reviewed_at: new Date().toISOString(),
        delivery_impact_days: deliveryImpactDays,
      };

      // Campos adicionais para customizações
      if (materials) {
        updateData.materials = materials;
      }
      if (laborHours !== undefined) {
        updateData.labor_hours = laborHours;
      }
      if (laborCostPerHour !== undefined) {
        updateData.labor_cost_per_hour = laborCostPerHour;
      }
      if (calculatedPrice !== undefined) {
        updateData.calculated_price = calculatedPrice;
        // Se aprovado com preço calculado, atualizar também o original_price
        if (approved && calculatedPrice > 0) {
          updateData.original_price = calculatedPrice;
        }
      }

      const { error } = await supabase
        .from("ato_configurations")
        .update(updateData)
        .eq("id", configId);

      if (error) throw error;

      // Verificar se todos os itens foram aprovados para avançar o workflow
      const { data: allConfigs, error: configsError } = await supabase
        .from("ato_configurations")
        .select("id, pm_status, delivery_impact_days, original_price")
        .eq("ato_id", atoId);

      if (configsError) throw configsError;

      const allReviewed = allConfigs?.every((c) => c.pm_status !== "pending");
      const allApproved = allConfigs?.every((c) => c.pm_status === "approved");
      const anyRejected = allConfigs?.some((c) => c.pm_status === "rejected");

      // Calcular totais
      const totalDeliveryImpact = allConfigs?.reduce(
        (sum, c) => sum + (c.delivery_impact_days || 0),
        0
      ) || 0;
      
      const totalPrice = allConfigs?.reduce(
        (sum, c) => sum + (c.original_price || 0),
        0
      ) || 0;

      if (allReviewed) {
        // Atualizar ATO com totais calculados
        const atoUpdate: Record<string, any> = {
          delivery_days_impact: totalDeliveryImpact,
          price_impact: totalPrice,
        };

        if (allApproved) {
          // Todos aprovados - completar workflow
          atoUpdate.workflow_status = "completed";
        } else if (anyRejected) {
          // Algum rejeitado - precisa revisão
          atoUpdate.workflow_status = "needs_revision";
        }

        const { error: atoError } = await supabase
          .from("additional_to_orders")
          .update(atoUpdate)
          .eq("id", atoId);

        if (atoError) throw atoError;

        // Atualizar step do workflow para completed se todos aprovados
        if (allApproved) {
          await supabase
            .from("ato_workflow_steps")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              notes: "Todos os itens aprovados pelo PM",
            })
            .eq("ato_id", atoId)
            .eq("step_type", "pm_review")
            .eq("status", "pending");
        }
      }

      return { configId, atoId, approved };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ato-configurations", data.atoId] });
      queryClient.invalidateQueries({ queryKey: ["ato", data.atoId] });
      queryClient.invalidateQueries({ queryKey: ["ato-workflow", data.atoId] });
      queryClient.invalidateQueries({ queryKey: ["atos"] });
      toast.success(data.approved ? "Item aprovado com sucesso!" : "Item rejeitado");
    },
    onError: (error: Error) => {
      console.error("Error approving ATO item:", error);
      toast.error("Erro ao processar item: " + error.message);
    },
  });
}

// Helper para calcular progresso da aprovação
export function calculateApprovalProgress(configurations: any[] | undefined) {
  if (!configurations || configurations.length === 0) {
    return { total: 0, approved: 0, rejected: 0, pending: 0, allApproved: false, allReviewed: false };
  }

  const approved = configurations.filter((c: any) => c.pm_status === "approved").length;
  const rejected = configurations.filter((c: any) => c.pm_status === "rejected").length;
  const pending = configurations.filter((c: any) => c.pm_status === "pending" || c.pm_status === null).length;

  return {
    total: configurations.length,
    approved,
    rejected,
    pending,
    allApproved: approved === configurations.length,
    allReviewed: pending === 0,
  };
}
