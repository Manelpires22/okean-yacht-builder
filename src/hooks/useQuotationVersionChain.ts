import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Função para calcular o preço final correto (incluindo upgrades com desconto)
export function calculateCorrectFinalPrice(quotation: any): number {
  // final_price do banco já inclui base + opcionais com desconto
  const savedFinalPrice = quotation.final_price || 0;
  
  // Calcular total de upgrades
  const upgradesTotal = (quotation.quotation_upgrades || []).reduce(
    (sum: number, u: any) => sum + (u.price || 0),
    0
  );
  
  // Aplicar desconto de opcionais aos upgrades
  const optionsDiscountPercentage = quotation.options_discount_percentage || 0;
  const upgradesDiscount = upgradesTotal * (optionsDiscountPercentage / 100);
  const finalUpgradesPrice = upgradesTotal - upgradesDiscount;
  
  // Final price correto = savedFinalPrice + upgrades com desconto
  // Nota: savedFinalPrice já inclui base e opcionais com desconto
  return savedFinalPrice + finalUpgradesPrice;
}

export function useQuotationVersionChain(quotationId: string) {
  return useQuery({
    queryKey: ['quotation-version-chain', quotationId],
    queryFn: async () => {
      // 1. Buscar cotação atual com upgrades
      const { data: current, error: currentError } = await supabase
        .from('quotations')
        .select('*, quotation_upgrades(price)')
        .eq('id', quotationId)
        .single();
      
      if (currentError) throw currentError;
      if (!current) throw new Error('Cotação não encontrada');
      
      // 2. Identificar a cotação raiz (v1)
      let rootQuotation = current;
      if (current.parent_quotation_id) {
        const { data: root, error: rootError } = await supabase
          .from('quotations')
          .select('*, quotation_upgrades(price)')
          .eq('id', current.parent_quotation_id)
          .single();
        
        if (!rootError && root) {
          rootQuotation = root;
        }
      }
      
      // 3. Buscar todas as versões da cadeia (root + todas filhas) com upgrades
      const { data: allVersions, error: versionsError } = await supabase
        .from('quotations')
        .select('*, quotation_upgrades(price)')
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
