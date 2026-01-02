import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

export interface SimulatorExchangeRate {
  id: string;
  currency: "EUR" | "USD";
  default_rate: number;
  source: "manual" | "api";
  last_api_update: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface SimulatorModelCost {
  id: string;
  yacht_model_id: string;
  custo_mp_import: number;
  custo_mp_import_currency: "EUR" | "USD";
  custo_mp_nacional: number;
  custo_mo_horas: number;
  custo_mo_valor_hora: number;
  tax_import_percent: number;
  is_exportable: boolean;
  updated_by: string | null;
  updated_at: string;
  yacht_model?: {
    id: string;
    name: string;
    code: string;
    base_price: number;
    image_url: string | null;
    display_order: number | null;
  };
}

export interface SimulatorCommission {
  id: string;
  name: string;
  type: "venda_interna" | "broker_interno" | "broker_externo" | "parceiro" | "sub_dealer";
  percent: number;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface SimulatorBusinessRule {
  id: string;
  rule_key: string;
  rule_value: number;
  description: string | null;
  category: string | null;
  updated_by: string | null;
  updated_at: string;
}

// ============================================
// Hooks
// ============================================

// Exchange Rates
export function useSimulatorExchangeRates() {
  return useQuery({
    queryKey: ["simulator-exchange-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulator_exchange_rates")
        .select("*")
        .order("currency");

      if (error) throw error;
      return data as SimulatorExchangeRate[];
    },
  });
}

export function useUpdateExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currency,
      default_rate,
      source = "manual",
    }: {
      currency: string;
      default_rate: number;
      source?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("simulator_exchange_rates")
        .update({
          default_rate,
          source,
          updated_by: userData.user?.id,
        })
        .eq("currency", currency);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-exchange-rates"] });
      toast.success("Taxa de câmbio atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar taxa: " + error.message);
    },
  });
}

// Model Costs
export function useSimulatorModelCosts() {
  return useQuery({
    queryKey: ["simulator-model-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulator_model_costs")
        .select(`
          *,
          yacht_model:yacht_models(id, name, code, base_price, image_url, display_order)
        `);

      if (error) throw error;
      return data as SimulatorModelCost[];
    },
  });
}

export function useUpsertModelCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cost: Partial<SimulatorModelCost> & { yacht_model_id: string }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("simulator_model_costs")
        .upsert({
          ...cost,
          updated_by: userData.user?.id,
        }, {
          onConflict: "yacht_model_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-model-costs"] });
      toast.success("Custos do modelo salvos");
    },
    onError: (error) => {
      toast.error("Erro ao salvar custos: " + error.message);
    },
  });
}

export function useDeleteModelCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("simulator_model_costs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-model-costs"] });
      toast.success("Custos do modelo removidos");
    },
    onError: (error) => {
      toast.error("Erro ao remover custos: " + error.message);
    },
  });
}

// Commissions
export function useSimulatorCommissions() {
  return useQuery({
    queryKey: ["simulator-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulator_commissions")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as SimulatorCommission[];
    },
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commission: Partial<SimulatorCommission>) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("simulator_commissions")
        .insert({
          name: commission.name!,
          type: commission.type!,
          percent: commission.percent,
          is_active: commission.is_active,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-commissions"] });
      toast.success("Comissão criada");
    },
    onError: (error) => {
      toast.error("Erro ao criar comissão: " + error.message);
    },
  });
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SimulatorCommission> & { id: string }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("simulator_commissions")
        .update({
          ...data,
          updated_by: userData.user?.id,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-commissions"] });
      toast.success("Comissão atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar comissão: " + error.message);
    },
  });
}

export function useDeleteCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("simulator_commissions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-commissions"] });
      toast.success("Comissão removida");
    },
    onError: (error) => {
      toast.error("Erro ao remover comissão: " + error.message);
    },
  });
}

// Business Rules
export function useSimulatorBusinessRules() {
  return useQuery({
    queryKey: ["simulator-business-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulator_business_rules")
        .select("*")
        .order("category")
        .order("rule_key");

      if (error) throw error;
      return data as SimulatorBusinessRule[];
    },
  });
}

// Helper para obter valores de regras de Trade-In
export function useTradeInRules() {
  const { data: rules } = useSimulatorBusinessRules();
  
  const getRuleValue = (key: string, defaultValue: number) => {
    const rule = rules?.find(r => r.rule_key === key);
    return rule?.rule_value ?? defaultValue;
  };
  
  return {
    tradeInOperationCostPercent: getRuleValue('trade_in_operation_cost_percent', 3),
    tradeInCommissionPercent: getRuleValue('trade_in_commission_percent', 5),
    tradeInCommissionReduction: getRuleValue('trade_in_commission_reduction', 0.5),
  };
}

export function useUpdateBusinessRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rule_key,
      rule_value,
      description,
    }: {
      rule_key: string;
      rule_value: number;
      description?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("simulator_business_rules")
        .update({
          rule_value,
          description,
          updated_by: userData.user?.id,
        })
        .eq("rule_key", rule_key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-business-rules"] });
      toast.success("Regra atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar regra: " + error.message);
    },
  });
}

export function useCreateBusinessRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Partial<SimulatorBusinessRule>) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("simulator_business_rules")
        .insert({
          rule_key: rule.rule_key!,
          rule_value: rule.rule_value,
          description: rule.description,
          category: rule.category,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-business-rules"] });
      toast.success("Regra criada");
    },
    onError: (error) => {
      toast.error("Erro ao criar regra: " + error.message);
    },
  });
}

export function useDeleteBusinessRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("simulator_business_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-business-rules"] });
      toast.success("Regra removida");
    },
    onError: (error) => {
      toast.error("Erro ao remover regra: " + error.message);
    },
  });
}
