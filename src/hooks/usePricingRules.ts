import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PricingRules, DEFAULT_PRICING_RULES } from "@/lib/pricing-markup";

/**
 * Hook para buscar as regras de pricing do banco (simulator_business_rules)
 * Retorna valores formatados para uso no cálculo de markup
 */
export function usePricingRules() {
  return useQuery({
    queryKey: ["pricing-rules"],
    queryFn: async (): Promise<PricingRules> => {
      const { data, error } = await supabase
        .from("simulator_business_rules")
        .select("rule_key, rule_value");
      
      if (error) throw error;
      
      // Mapear regras do banco para o formato esperado
      const rulesMap: Record<string, number> = {};
      data?.forEach(rule => {
        rulesMap[rule.rule_key] = parseFloat(String(rule.rule_value)) || 0;
      });
      
      return {
        mdcPercent: 30, // MDC alvo fixo em 30%
        salesTaxDomestic: rulesMap['sales_tax_domestic'] ?? DEFAULT_PRICING_RULES.salesTaxDomestic,
        salesTaxExport: rulesMap['sales_tax_export'] ?? DEFAULT_PRICING_RULES.salesTaxExport,
        warrantyDomestic: rulesMap['warranty_domestic'] ?? DEFAULT_PRICING_RULES.warrantyDomestic,
        warrantyExport: rulesMap['warranty_export'] ?? DEFAULT_PRICING_RULES.warrantyExport,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
}

/**
 * Hook para verificar se um modelo é exportável
 */
export function useIsModelExportable(yachtModelId: string | null) {
  return useQuery({
    queryKey: ["model-exportable", yachtModelId],
    queryFn: async (): Promise<boolean> => {
      if (!yachtModelId) return false;
      
      const { data, error } = await supabase
        .from("simulator_model_costs")
        .select("is_exportable")
        .eq("yacht_model_id", yachtModelId)
        .maybeSingle();
      
      if (error) {
        console.error("Erro ao verificar exportabilidade:", error);
        return false;
      }
      
      return data?.is_exportable ?? false;
    },
    enabled: !!yachtModelId,
  });
}
