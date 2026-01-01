import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExchangeRateResponse {
  rate: number;
  source: 'bcb' | 'cache' | 'cache-fallback';
  updatedAt: string;
  error?: string;
}

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate', 'EUR-BRL'],
    queryFn: async (): Promise<ExchangeRateResponse> => {
      const { data, error } = await supabase.functions.invoke('get-exchange-rate');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as ExchangeRateResponse;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 2,
  });
}
