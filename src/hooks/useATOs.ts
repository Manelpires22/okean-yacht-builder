import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ATO {
  id: string;
  contract_id: string;
  ato_number: string;
  sequence_number: number;
  title: string;
  description: string | null;
  price_impact: number;
  delivery_days_impact: number;
  discount_percentage: number;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "cancelled";
  workflow_status: string | null;
  requested_by: string;
  requested_at: string;
  requires_approval: boolean;
  commercial_approval_status: "pending" | "approved" | "rejected" | null;
  technical_approval_status: "pending" | "approved" | "rejected" | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  contract?: any;
  requested_by_user?: any;
  configurations?: Array<{ id: string }>;
}

export interface CreateATOInput {
  contract_id: string;
  title: string;
  description?: string;
  price_impact: number;
  delivery_days_impact: number;
  workflow_status?: string | null;
  configurations?: Array<{
    item_type: "memorial_item" | "option";
    item_id: string | null;
    configuration_details: any;
    sub_items?: any[];
    notes?: string;
  }>;
  notes?: string;
}

export function useATOs(contractId: string | undefined) {
  return useQuery({
    queryKey: ["atos", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      const { data, error } = await supabase
        .from("additional_to_orders")
        .select(`
          *,
          contract:contracts(contract_number, status),
          configurations:ato_configurations(id)
        `)
        .eq("contract_id", contractId)
        .order("sequence_number", { ascending: true });

      if (error) throw error;
      return data as ATO[];
    },
    enabled: !!contractId,
  });
}

export function useATO(atoId: string | undefined) {
  return useQuery({
    queryKey: ["ato", atoId],
    queryFn: async () => {
      if (!atoId) throw new Error("ATO ID is required");

      const { data, error } = await supabase
        .from("additional_to_orders")
        .select(`
          *,
          contract:contracts(*),
          configurations:ato_configurations(*)
        `)
        .eq("id", atoId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!atoId,
  });
}

export function useCreateATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateATOInput) => {
      // 0. Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Buscar próximo sequence_number
      const { data: existingATOs, error: countError } = await supabase
        .from("additional_to_orders")
        .select("sequence_number")
        .eq("contract_id", input.contract_id)
        .order("sequence_number", { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextSequence = existingATOs && existingATOs.length > 0 
        ? existingATOs[0].sequence_number + 1 
        : 1;

      const atoNumber = `ATO ${nextSequence}`;

      // 2. Determinar se precisa aprovação (similar a cotações)
      const requiresApproval = Math.abs(input.price_impact) > 0 || input.delivery_days_impact > 7;

      // 3. Criar ATO com workflow_status se fornecido
      const { data: ato, error: atoError } = await supabase
        .from("additional_to_orders")
        .insert({
          contract_id: input.contract_id,
          ato_number: atoNumber,
          sequence_number: nextSequence,
          title: input.title,
          description: input.description,
          price_impact: input.price_impact,
          delivery_days_impact: input.delivery_days_impact,
          notes: input.notes,
          requested_by: user.id,
          status: input.workflow_status ? "pending_approval" : (requiresApproval ? "pending_approval" : "approved"),
          requires_approval: requiresApproval || !!input.workflow_status,
          commercial_approval_status: requiresApproval && !input.workflow_status ? "pending" : null,
          workflow_status: input.workflow_status || null,
        })
        .select()
        .single();

      if (atoError) throw atoError;

      // 4. Criar configurações de itens
      if (input.configurations && input.configurations.length > 0) {
        const { error: configError } = await supabase
          .from("ato_configurations")
          .insert(
            input.configurations.map((config) => ({
              ato_id: ato.id,
              item_type: config.item_type,
              item_id: config.item_id,
              configuration_details: config.configuration_details,
              sub_items: config.sub_items || [],
              notes: config.notes,
              created_by: user.id,
            }))
          );

        if (configError) throw configError;
      }

      // 5. Criar approval request se necessário
      if (requiresApproval) {
        const { error: approvalError } = await supabase
          .from("approvals")
          .insert({
            quotation_id: null, // ATOs não usam quotation_id diretamente
            approval_type: "commercial",
            status: "pending",
            requested_by: user.id,
            request_details: {
              ato_id: ato.id,
              contract_id: input.contract_id,
              price_impact: input.price_impact,
              delivery_days_impact: input.delivery_days_impact,
            },
          });

        if (approvalError) throw approvalError;
      }

      return ato;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["atos", variables.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["live-contract", variables.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("ATO criada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating ATO:", error);
      toast.error("Erro ao criar ATO: " + error.message);
    },
  });
}

export function useApproveATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      atoId,
      approved,
      notes,
    }: {
      atoId: string;
      approved: boolean;
      notes?: string;
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // 1. Atualizar status da ATO
      const { data, error } = await supabase
        .from("additional_to_orders")
        .update({
          status: approved ? "approved" : "rejected",
          commercial_approval_status: approved ? "approved" : "rejected",
          approved_by: userId,
          approved_at: new Date().toISOString(),
          rejection_reason: approved ? null : notes,
        })
        .eq("id", atoId)
        .select()
        .single();

      if (error) throw error;

      // 2. Atualizar approval request relacionada
      const { error: approvalError } = await supabase
        .from("approvals")
        .update({
          status: approved ? "approved" : "rejected",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq("request_details->>ato_id", atoId);

      if (approvalError) throw approvalError;

      // 3. Se aprovado, atualizar totais do contrato (manualmente)
      if (approved && data) {
        // Recalcular totais do contrato
        const { data: contract } = await supabase
          .from("contracts")
          .select("id, base_price, base_delivery_days")
          .eq("id", data.contract_id)
          .single();

        if (contract) {
          const { data: approvedATOs } = await supabase
            .from("additional_to_orders")
            .select("price_impact, delivery_days_impact")
            .eq("contract_id", data.contract_id)
            .eq("status", "approved");

          const totalATOsPrice = approvedATOs?.reduce((sum, ato) => sum + (ato.price_impact || 0), 0) || 0;
          const totalATOsDelivery = approvedATOs?.reduce((max, ato) => Math.max(max, ato.delivery_days_impact || 0), 0) || 0;

          await supabase
            .from("contracts")
            .update({
              current_total_price: contract.base_price + totalATOsPrice,
              current_total_delivery_days: contract.base_delivery_days + totalATOsDelivery,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.contract_id);
        }
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["atos", data.contract_id] });
        queryClient.invalidateQueries({ queryKey: ["ato", data.id] });
        queryClient.invalidateQueries({ queryKey: ["live-contract", data.contract_id] });
        queryClient.invalidateQueries({ queryKey: ["contracts"] });
        queryClient.invalidateQueries({ queryKey: ["approvals"] });
      }
      toast.success("ATO processada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error approving ATO:", error);
      toast.error("Erro ao processar ATO: " + error.message);
    },
  });
}

export function useUpdateATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      atoId,
      updates,
    }: {
      atoId: string;
      updates: Partial<ATO>;
    }) => {
      const { data, error } = await supabase
        .from("additional_to_orders")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", atoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atos", data.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["ato", data.id] });
      toast.success("ATO atualizada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error updating ATO:", error);
      toast.error("Erro ao atualizar ATO");
    },
  });
}

export function useCancelATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (atoId: string) => {
      const { data, error } = await supabase
        .from("additional_to_orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", atoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atos", data.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["ato", data.id] });
      toast.success("ATO cancelada");
    },
    onError: (error: Error) => {
      console.error("Error cancelling ATO:", error);
      toast.error("Erro ao cancelar ATO");
    },
  });
}

export function useDeleteATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (atoId: string) => {
      // Buscar contract_id antes de deletar
      const { data: ato } = await supabase
        .from("additional_to_orders")
        .select("contract_id")
        .eq("id", atoId)
        .single();
      
      const contractId = ato?.contract_id;

      // Deletar configurações primeiro (cascade deveria fazer, mas garantir)
      await supabase
        .from("ato_configurations")
        .delete()
        .eq("ato_id", atoId);

      // Deletar workflow steps
      await supabase
        .from("ato_workflow_steps")
        .delete()
        .eq("ato_id", atoId);

      // Deletar ATO
      const { error } = await supabase
        .from("additional_to_orders")
        .delete()
        .eq("id", atoId);

      if (error) throw error;
      return { contractId };
    },
    onSuccess: (data) => {
      if (data.contractId) {
        queryClient.invalidateQueries({ queryKey: ["atos", data.contractId] });
      }
      queryClient.invalidateQueries({ queryKey: ["atos"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["live-contract"] });
      toast.success("ATO excluída permanentemente");
    },
    onError: (error: Error) => {
      console.error("Error deleting ATO:", error);
      toast.error("Erro ao excluir ATO: " + error.message);
    },
  });
}
