import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Contract {
  id: string;
  quotation_id: string;
  client_id: string;
  yacht_model_id: string;
  contract_number: string;
  base_price: number;
  base_delivery_days: number;
  base_snapshot: any;
  current_total_price: number;
  current_total_delivery_days: number;
  status: "active" | "completed" | "cancelled";
  signed_at: string;
  signed_by_name: string | null;
  signed_by_email: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  
  // Relacionamentos (quando incluídos no select)
  quotation?: any;
  client?: any;
  yacht_model?: any;
}

export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          quotation:quotations(quotation_number, status),
          client:clients(name, email, phone),
          yacht_model:yacht_models(name, code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
  });
}

export function useContract(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          quotation:quotations(*),
          client:clients(*),
          yacht_model:yacht_models(*)
        `)
        .eq("id", contractId)
        .single();

      if (error) throw error;
      return data as Contract;
    },
    enabled: !!contractId,
  });
}

export function useLiveContract(contractId: string | undefined) {
  return useQuery({
    queryKey: ["live-contract", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      const { data, error } = await supabase
        .from("live_contracts")
        .select("*")
        .eq("contract_id", contractId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });
}

export function useUpdateContractStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      status,
    }: {
      contractId: string;
      status: "active" | "completed" | "cancelled";
    }) => {
      const { data, error } = await supabase
        .from("contracts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", variables.contractId] });
      toast.success("Status do contrato atualizado com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error updating contract status:", error);
      toast.error("Erro ao atualizar status do contrato");
    },
  });
}

export function useCreateContractFromQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "create-contract-from-quotation",
        {
          body: { quotation_id: quotationId },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Contrato criado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating contract:", error);
      toast.error("Erro ao criar contrato: " + error.message);
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      // 1. Buscar dados do contrato antes de deletar
      const { data: contract, error: fetchError } = await supabase
        .from("contracts")
        .select("quotation_id")
        .eq("id", contractId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Reverter customizações (included_in_contract = false)
      const { error: customizationsError } = await supabase
        .from("quotation_customizations")
        .update({ included_in_contract: false })
        .eq("quotation_id", contract.quotation_id);

      if (customizationsError) {
        console.warn("Error reverting customizations:", customizationsError);
      }

      // 3. Reverter status da cotação
      const { error: quotationError } = await supabase
        .from("quotations")
        .update({ status: "accepted" })
        .eq("id", contract.quotation_id);

      if (quotationError) {
        console.warn("Error reverting quotation status:", quotationError);
      }

      // 4. Deletar contrato
      const { error: deleteError } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contractId);

      if (deleteError) throw deleteError;

      return { contractId, quotationId: contract.quotation_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", data.contractId] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", data.quotationId] });
      toast.success("Contrato deletado e cotação revertida com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error deleting contract:", error);
      toast.error("Erro ao deletar contrato: " + error.message);
    },
  });
}
