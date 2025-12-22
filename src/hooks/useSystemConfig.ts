import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Tipos das configurações
export interface SystemConfigValues {
  // Cotação
  quotation_validity_days: number;
  
  // Precificação
  default_labor_cost_per_hour: number;
  pricing_markup_divisor: number;
  pricing_margin_percent: number;
  pricing_tax_percent: number;
  pricing_warranty_percent: number;
  pricing_commission_percent: number;
  
  // Cache
  cache_stale_time_ms: number;
  workflow_refetch_interval_ms: number;
  
  // Empresa
  company_name: string;
  company_email: string;
  app_url: string;
}

// Valores padrão para fallback
const DEFAULT_CONFIG: SystemConfigValues = {
  quotation_validity_days: 30,
  default_labor_cost_per_hour: 55,
  pricing_markup_divisor: 0.43,
  pricing_margin_percent: 30,
  pricing_tax_percent: 21,
  pricing_warranty_percent: 3,
  pricing_commission_percent: 3,
  cache_stale_time_ms: 30000,
  workflow_refetch_interval_ms: 60000,
  company_name: "OKEAN Yachts",
  company_email: "contato@okeanyachts.com",
  app_url: "https://okean.lovable.app",
};

// Cache global para evitar múltiplas requests
let cachedConfig: SystemConfigValues | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para buscar configurações do sistema do Supabase
 * Usa cache de 5 minutos para evitar requests excessivos
 */
export function useSystemConfig() {
  return useQuery({
    queryKey: ['system-config'],
    queryFn: async (): Promise<SystemConfigValues> => {
      // Verificar cache local primeiro
      if (cachedConfig && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        return cachedConfig;
      }

      const { data, error } = await supabase
        .from('system_config')
        .select('config_key, config_value');

      if (error) {
        console.error('Erro ao buscar system_config:', error);
        return DEFAULT_CONFIG;
      }

      // Converter array para objeto tipado
      const config: SystemConfigValues = { ...DEFAULT_CONFIG };
      
      data?.forEach((item) => {
        const key = item.config_key;
        const rawValue = item.config_value;
        
        // Parse do JSON value com type assertion
        let parsedValue: string | number;
        if (typeof rawValue === 'string') {
          try {
            parsedValue = JSON.parse(rawValue);
          } catch {
            parsedValue = rawValue;
          }
        } else if (typeof rawValue === 'number') {
          parsedValue = rawValue;
        } else {
          parsedValue = String(rawValue);
        }
        
        // Atribuir valores de forma type-safe
        switch (key) {
          case 'quotation_validity_days':
          case 'default_labor_cost_per_hour':
          case 'pricing_margin_percent':
          case 'pricing_tax_percent':
          case 'pricing_warranty_percent':
          case 'pricing_commission_percent':
          case 'cache_stale_time_ms':
          case 'workflow_refetch_interval_ms':
            config[key] = Number(parsedValue);
            break;
          case 'pricing_markup_divisor':
            config[key] = Number(parsedValue);
            break;
          case 'company_name':
          case 'company_email':
          case 'app_url':
            config[key] = String(parsedValue);
            break;
        }
      });

      // Atualizar cache
      cachedConfig = config;
      cacheTimestamp = Date.now();

      return config;
    },
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2,
  });
}

/**
 * Função síncrona para obter configuração do cache
 * Retorna default se cache não existir
 */
export function getSystemConfigSync(): SystemConfigValues {
  if (cachedConfig && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedConfig;
  }
  return DEFAULT_CONFIG;
}

/**
 * Helper para calcular preço sugerido baseado no markup configurado
 */
export function calculateSuggestedPrice(
  totalCost: number, 
  markupDivisor: number = DEFAULT_CONFIG.pricing_markup_divisor
): number {
  if (markupDivisor <= 0) return totalCost;
  return Math.round((totalCost / markupDivisor) * 100) / 100;
}

/**
 * Helper para calcular breakdown do markup
 */
export function calculateMarkupBreakdown(totalCost: number, config: SystemConfigValues) {
  return {
    marginValue: totalCost * (config.pricing_margin_percent / 100),
    taxValue: totalCost * (config.pricing_tax_percent / 100),
    warrantyValue: totalCost * (config.pricing_warranty_percent / 100),
    commissionValue: totalCost * (config.pricing_commission_percent / 100),
  };
}
