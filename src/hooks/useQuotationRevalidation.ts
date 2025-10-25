import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RevalidationIssue {
  type: 'price_change' | 'option_discontinued' | 'lead_time_change';
  message: string;
  oldValue?: string | number;
  newValue?: string | number;
  changePercentage?: number;
}

export function useQuotationRevalidation(quotationId: string | undefined) {
  return useQuery({
    queryKey: ['quotation-revalidation', quotationId],
    queryFn: async () => {
      if (!quotationId) return { issues: [], needsRevalidation: false };

      // Buscar cotação com dados relacionados
      const { data: quotation, error } = await supabase
        .from('quotations')
        .select(`
          *,
          yacht_model:yacht_models(id, base_price, base_delivery_days),
          quotation_options(
            option_id,
            unit_price,
            options(id, is_active, base_price)
          )
        `)
        .eq('id', quotationId)
        .single();

      if (error) throw error;
      if (!quotation) return { issues: [], needsRevalidation: false };

      const issues: RevalidationIssue[] = [];

      // Verificar mudança no preço base do modelo
      if (quotation.yacht_model) {
        const currentBasePrice = quotation.yacht_model.base_price;
        const quotationBasePrice = quotation.base_price;
        const priceChange = ((currentBasePrice - quotationBasePrice) / quotationBasePrice) * 100;

        if (Math.abs(priceChange) > 2) {
          issues.push({
            type: 'price_change',
            message: `Preço base do modelo mudou de ${quotationBasePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para ${currentBasePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
            oldValue: quotationBasePrice,
            newValue: currentBasePrice,
            changePercentage: priceChange
          });
        }
      }

      // Verificar opcionais descontinuados
      if (quotation.quotation_options) {
        for (const qo of quotation.quotation_options) {
          if (qo.options && !qo.options.is_active) {
            issues.push({
              type: 'option_discontinued',
              message: `Opcional foi descontinuado e não está mais disponível`,
              oldValue: qo.unit_price,
              newValue: 0
            });
          } else if (qo.options) {
            // Verificar mudança de preço do opcional
            const priceChange = ((qo.options.base_price - qo.unit_price) / qo.unit_price) * 100;
            if (Math.abs(priceChange) > 5) {
              issues.push({
                type: 'price_change',
                message: `Preço de opcional mudou significativamente`,
                oldValue: qo.unit_price,
                newValue: qo.options.base_price,
                changePercentage: priceChange
              });
            }
          }
        }
      }

      // Verificar mudança no prazo de entrega
      if (quotation.yacht_model) {
        const currentDeliveryDays = quotation.yacht_model.base_delivery_days;
        const quotationDeliveryDays = quotation.base_delivery_days;
        const deliveryChange = currentDeliveryDays - quotationDeliveryDays;

        if (Math.abs(deliveryChange) > 15) {
          issues.push({
            type: 'lead_time_change',
            message: `Prazo de entrega base mudou de ${quotationDeliveryDays} para ${currentDeliveryDays} dias`,
            oldValue: quotationDeliveryDays,
            newValue: currentDeliveryDays,
            changePercentage: (deliveryChange / quotationDeliveryDays) * 100
          });
        }
      }

      return {
        issues,
        needsRevalidation: issues.length > 0
      };
    },
    enabled: !!quotationId
  });
}
