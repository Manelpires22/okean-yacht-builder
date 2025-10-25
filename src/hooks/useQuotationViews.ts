import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuotationView {
  id: string;
  quotation_id: string;
  viewed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  time_on_page_seconds: number | null;
  created_at: string;
}

export function useQuotationViews(quotationId: string | undefined) {
  return useQuery({
    queryKey: ['quotation-views', quotationId],
    queryFn: async () => {
      if (!quotationId) return { views: [], totalViews: 0, lastViewed: null };

      const { data, error } = await supabase
        .from('quotation_views' as any)
        .select('*')
        .eq('quotation_id', quotationId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      const views = (data || []) as unknown as QuotationView[];

      return {
        views,
        totalViews: views.length,
        lastViewed: views[0]?.viewed_at || null
      };
    },
    enabled: !!quotationId
  });
}

export async function trackQuotationView(
  quotationId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const { error } = await supabase
    .from('quotation_views' as any)
    .insert({
      quotation_id: quotationId,
      ip_address: ipAddress,
      user_agent: userAgent,
      viewed_at: new Date().toISOString()
    });

  if (error) {
    console.error('Erro ao registrar visualização:', error);
  }
}
