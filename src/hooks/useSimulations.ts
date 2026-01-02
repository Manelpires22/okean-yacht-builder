import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SimulatorState, ExportCurrency } from "./useSimulatorState";

export interface Simulation {
  id: string;
  simulation_number: string;
  client_id: string | null;
  client_name: string;
  commission_id: string | null;
  commission_name: string;
  commission_percent: number;
  commission_type: string | null;
  yacht_model_id: string | null;
  yacht_model_code: string;
  yacht_model_name: string;
  is_exporting: boolean;
  export_country: string | null;
  export_currency: ExportCurrency | null;
  faturamento_bruto: number;
  transporte_cost: number;
  customizacoes_estimadas: number;
  sales_tax_percent: number;
  warranty_percent: number;
  royalties_percent: number;
  tax_import_percent: number;
  custo_mp_import: number;
  custo_mp_import_currency: string;
  custo_mp_nacional: number;
  custo_mo_horas: number;
  custo_mo_valor_hora: number;
  eur_rate: number;
  usd_rate: number;
  faturamento_liquido: number;
  custo_venda: number;
  margem_bruta: number;
  margem_percent: number;
  adjusted_commission_percent: number | null;
  commission_adjustment_factor: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Trade-In fields
  has_trade_in: boolean | null;
  trade_in_brand: string | null;
  trade_in_model: string | null;
  trade_in_year: number | null;
  trade_in_entry_value: number | null;
  trade_in_real_value: number | null;
  trade_in_depreciation: number | null;
  trade_in_operation_cost: number | null;
  trade_in_commission: number | null;
  trade_in_total_impact: number | null;
  // Trade-In percentages
  trade_in_operation_cost_percent: number | null;
  trade_in_commission_percent: number | null;
  trade_in_commission_reduction_percent: number | null;
}

interface SaveSimulationData {
  state: SimulatorState;
  clientId: string | null;
  clientName: string;
  calculations: {
    fatLiquido: number;
    custoVenda: number;
    margemBruta: number;
    margemPercent: number;
    adjustedCommissionPercent: number;
    commissionAdjustmentFactor: number;
    // Trade-In calculations
    tradeInDepreciation?: number;
    tradeInOperationCost?: number;
    tradeInCommission?: number;
    tradeInTotalImpact?: number;
  };
  notes?: string;
}

function generateSimulationNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SIM-${dateStr}-${randomPart}`;
}

export function useSimulations() {
  return useQuery({
    queryKey: ['simulations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Simulation[];
    },
  });
}

export function useSaveSimulation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SaveSimulationData) => {
      const { state, clientId, clientName, calculations, notes } = data;

      const simulationData = {
        simulation_number: generateSimulationNumber(),
        client_id: clientId,
        client_name: clientName,
        commission_id: state.selectedCommissionId,
        commission_name: state.selectedCommissionName,
        commission_percent: state.selectedCommissionPercent,
        commission_type: state.selectedCommissionType,
        yacht_model_id: state.selectedModelId,
        yacht_model_code: state.selectedModelCode,
        yacht_model_name: state.selectedModelName,
        is_exporting: state.isExporting,
        export_country: state.exportCountry,
        export_currency: state.exportCurrency,
        faturamento_bruto: state.faturamentoBruto,
        transporte_cost: state.transporteCost,
        customizacoes_estimadas: state.customizacoesEstimadas,
        sales_tax_percent: state.salesTaxPercent,
        warranty_percent: state.warrantyPercent,
        royalties_percent: state.royaltiesPercent,
        tax_import_percent: state.taxImportPercent,
        custo_mp_import: state.custoMpImport,
        custo_mp_import_currency: state.custoMpImportCurrency,
        custo_mp_nacional: state.custoMpNacional,
        custo_mo_horas: state.custoMoHoras,
        custo_mo_valor_hora: state.custoMoValorHora,
        eur_rate: state.eurRate,
        usd_rate: state.usdRate,
        faturamento_liquido: calculations.fatLiquido,
        custo_venda: calculations.custoVenda,
        margem_bruta: calculations.margemBruta,
        margem_percent: calculations.margemPercent,
        // Salvar comissão ajustada do state (local por simulação)
        adjusted_commission_percent: state.adjustedCommissionPercent,
        commission_adjustment_factor: calculations.commissionAdjustmentFactor,
        notes,
        created_by: user?.id,
        // Trade-In fields
        has_trade_in: state.hasTradeIn,
        trade_in_brand: state.hasTradeIn ? state.tradeInBrand : null,
        trade_in_model: state.hasTradeIn ? state.tradeInModel : null,
        trade_in_year: state.hasTradeIn ? state.tradeInYear : null,
        trade_in_entry_value: state.hasTradeIn ? state.tradeInEntryValue : 0,
        trade_in_real_value: state.hasTradeIn ? state.tradeInRealValue : 0,
        trade_in_depreciation: calculations.tradeInDepreciation ?? 0,
        trade_in_operation_cost: calculations.tradeInOperationCost ?? 0,
        trade_in_commission: calculations.tradeInCommission ?? 0,
        trade_in_total_impact: calculations.tradeInTotalImpact ?? 0,
        // Trade-In percentages (from state or defaults)
        trade_in_operation_cost_percent: state.hasTradeIn ? (state.tradeInOperationCostPercent ?? 3) : null,
        trade_in_commission_percent: state.hasTradeIn ? (state.tradeInCommissionPercent ?? 5) : null,
        trade_in_commission_reduction_percent: state.hasTradeIn ? (state.tradeInCommissionReduction ?? 0.5) : null,
      };

      const { data: simulation, error } = await supabase
        .from('simulations')
        .insert(simulationData)
        .select()
        .single();

      if (error) throw error;
      return simulation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success("Simulação gravada com sucesso!");
    },
    onError: (error) => {
      console.error('Error saving simulation:', error);
      toast.error("Erro ao gravar simulação");
    },
  });
}

export function useDeleteSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('simulations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success("Simulação excluída");
    },
    onError: (error) => {
      console.error('Error deleting simulation:', error);
      toast.error("Erro ao excluir simulação");
    },
  });
}

export function useUpdateSimulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SaveSimulationData }) => {
      const { state, clientId, clientName, calculations, notes } = data;

      const updateData = {
        // Não atualiza simulation_number (mantém original)
        client_id: clientId,
        client_name: clientName,
        commission_id: state.selectedCommissionId,
        commission_name: state.selectedCommissionName,
        commission_percent: state.selectedCommissionPercent,
        commission_type: state.selectedCommissionType,
        yacht_model_id: state.selectedModelId,
        yacht_model_code: state.selectedModelCode,
        yacht_model_name: state.selectedModelName,
        is_exporting: state.isExporting,
        export_country: state.exportCountry,
        export_currency: state.exportCurrency,
        faturamento_bruto: state.faturamentoBruto,
        transporte_cost: state.transporteCost,
        customizacoes_estimadas: state.customizacoesEstimadas,
        sales_tax_percent: state.salesTaxPercent,
        warranty_percent: state.warrantyPercent,
        royalties_percent: state.royaltiesPercent,
        tax_import_percent: state.taxImportPercent,
        custo_mp_import: state.custoMpImport,
        custo_mp_import_currency: state.custoMpImportCurrency,
        custo_mp_nacional: state.custoMpNacional,
        custo_mo_horas: state.custoMoHoras,
        custo_mo_valor_hora: state.custoMoValorHora,
        eur_rate: state.eurRate,
        usd_rate: state.usdRate,
        faturamento_liquido: calculations.fatLiquido,
        custo_venda: calculations.custoVenda,
        margem_bruta: calculations.margemBruta,
        margem_percent: calculations.margemPercent,
        adjusted_commission_percent: state.adjustedCommissionPercent,
        commission_adjustment_factor: calculations.commissionAdjustmentFactor,
        notes,
        // Trade-In fields
        has_trade_in: state.hasTradeIn,
        trade_in_brand: state.hasTradeIn ? state.tradeInBrand : null,
        trade_in_model: state.hasTradeIn ? state.tradeInModel : null,
        trade_in_year: state.hasTradeIn ? state.tradeInYear : null,
        trade_in_entry_value: state.hasTradeIn ? state.tradeInEntryValue : 0,
        trade_in_real_value: state.hasTradeIn ? state.tradeInRealValue : 0,
        trade_in_depreciation: calculations.tradeInDepreciation ?? 0,
        trade_in_operation_cost: calculations.tradeInOperationCost ?? 0,
        trade_in_commission: calculations.tradeInCommission ?? 0,
        trade_in_total_impact: calculations.tradeInTotalImpact ?? 0,
        // Trade-In percentages
        trade_in_operation_cost_percent: state.hasTradeIn ? (state.tradeInOperationCostPercent ?? 3) : null,
        trade_in_commission_percent: state.hasTradeIn ? (state.tradeInCommissionPercent ?? 5) : null,
        trade_in_commission_reduction_percent: state.hasTradeIn ? (state.tradeInCommissionReduction ?? 0.5) : null,
        updated_at: new Date().toISOString(),
      };

      const { data: simulation, error } = await supabase
        .from('simulations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return simulation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success("Simulação atualizada!");
    },
    onError: (error) => {
      console.error('Error updating simulation:', error);
      toast.error("Erro ao atualizar simulação");
    },
  });
}
