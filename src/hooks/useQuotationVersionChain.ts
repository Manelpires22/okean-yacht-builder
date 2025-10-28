import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useQuotationVersionChain(quotationId: string) {
  return useQuery({
    queryKey: ['quotation-version-chain', quotationId],
    queryFn: async () => {
      // 1. Buscar cotação atual
      const { data: current, error: currentError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', quotationId)
        .single();
      
      if (currentError) throw currentError;
      if (!current) throw new Error('Cotação não encontrada');
      
      // 2. Identificar a cotação raiz (v1)
      let rootQuotation = current;
      if (current.parent_quotation_id) {
        const { data: root, error: rootError } = await supabase
          .from('quotations')
          .select('*')
          .eq('id', current.parent_quotation_id)
          .single();
        
        if (!rootError && root) {
          rootQuotation = root;
        }
      }
      
      // 3. Buscar todas as versões da cadeia (root + todas filhas)
      const { data: allVersions, error: versionsError } = await supabase
        .from('quotations')
        .select('*')
        .or(`id.eq.${rootQuotation.id},parent_quotation_id.eq.${rootQuotation.id}`)
        .order('version', { ascending: false });
      
      if (versionsError) throw versionsError;
      
      const versions = allVersions || [];
      const latestVersion = versions[0]; // Já ordenado DESC
      const isLatest = current.id === latestVersion?.id;
      
      return {
        currentQuotation: current,
        rootQuotation,
        allVersions: versions,
        isLatest,
        latestVersion
      };
    },
    enabled: !!quotationId
  });
}
