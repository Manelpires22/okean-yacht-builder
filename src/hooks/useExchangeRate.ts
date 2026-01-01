import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Currency = 'EUR' | 'USD';

interface ExchangeRateResponse {
  rate: number;
  currency: Currency;
  source: 'bcb' | 'cache' | 'cache-fallback';
  updatedAt: string;
  error?: string;
}

export function useExchangeRate(currency: Currency = 'EUR') {
  return useQuery({
    queryKey: ['exchange-rate', currency],
    queryFn: async (): Promise<ExchangeRateResponse> => {
      const { data, error } = await supabase.functions.invoke('get-exchange-rate', {
        body: null,
        headers: {},
      });
      
      // Use query params via URL - invoke doesn't support query params directly
      // So we call with fetch instead
      const response = await fetch(
        `https://qqxhkaowexieednyazwq.supabase.co/functions/v1/get-exchange-rate?currency=${currency}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar cotação');
      }
      
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    retry: 2,
  });
}
