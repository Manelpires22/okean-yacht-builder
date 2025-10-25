import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateCustomizationStatusInput {
  customizationId: string;
  quotationId: string;
  status: 'approved' | 'rejected';
  engineeringNotes: string;
  additionalCost?: number;
  deliveryImpactDays?: number;
}

export function useUpdateCustomizationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCustomizationStatusInput) => {
      const { 
        customizationId, 
        quotationId,
        status, 
        engineeringNotes, 
        additionalCost, 
        deliveryImpactDays 
      } = input;

      // 1. Obter usuário atual (engenheiro)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 2. Atualizar customização
      const { error: updateError } = await supabase
        .from('quotation_customizations')
        .update({
          status,
          engineering_notes: engineeringNotes,
          additional_cost: additionalCost || 0,
          delivery_impact_days: deliveryImpactDays || 0,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', customizationId);

      if (updateError) throw updateError;

      // 3. Se aprovado, recalcular totais da cotação
      if (status === 'approved' && (additionalCost || deliveryImpactDays)) {
        // Buscar customizações atualizadas
        const { data: customizations, error: fetchError } = await supabase
          .from('quotation_customizations')
          .select('additional_cost, delivery_impact_days')
          .eq('quotation_id', quotationId)
          .eq('status', 'approved');

        if (fetchError) throw fetchError;

        // Calcular total de customizações e impacto no prazo
        const totalCustomizationsCost = customizations?.reduce(
          (sum, c) => sum + (c.additional_cost || 0),
          0
        ) || 0;

        const maxDeliveryImpact = Math.max(
          ...(customizations?.map(c => c.delivery_impact_days || 0) || [0])
        );

        // Buscar cotação atual
        const { data: quotation, error: quotationError } = await supabase
          .from('quotations')
          .select('base_delivery_days, final_base_price, final_options_price')
          .eq('id', quotationId)
          .single();

        if (quotationError) throw quotationError;

        // Atualizar totais
        const newTotalPrice = 
          (quotation.final_base_price || 0) + 
          (quotation.final_options_price || 0) + 
          totalCustomizationsCost;

        const newTotalDeliveryDays = 
          (quotation.base_delivery_days || 0) + 
          maxDeliveryImpact;

        const { error: updateQuotationError } = await supabase
          .from('quotations')
          .update({
            total_customizations_price: totalCustomizationsCost,
            final_price: newTotalPrice,
            total_delivery_days: newTotalDeliveryDays
          })
          .eq('id', quotationId);

        if (updateQuotationError) throw updateQuotationError;
      }

      // 4. Verificar se todas as customizações foram aprovadas/rejeitadas
      const { data: pendingCustomizations } = await supabase
        .from('quotation_customizations')
        .select('id')
        .eq('quotation_id', quotationId)
        .eq('status', 'pending');

      // Se não há mais customizações pendentes, atualizar status da cotação
      if (!pendingCustomizations || pendingCustomizations.length === 0) {
        // Verificar se precisa aprovação comercial também
        const { data: quotation } = await supabase
          .from('quotations')
          .select('base_discount_percentage, options_discount_percentage')
          .eq('id', quotationId)
          .single();

        if (quotation) {
          const maxDiscount = Math.max(
            quotation.base_discount_percentage || 0,
            quotation.options_discount_percentage || 0
          );

          const needsCommercialApproval = maxDiscount > 10;

          // Se não precisa aprovação comercial, marcar como ready_to_send
          if (!needsCommercialApproval) {
            await supabase
              .from('quotations')
              .update({ status: 'ready_to_send' })
              .eq('id', quotationId);
          }
        }
      }

      return { customizationId, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      
      if (data.status === 'approved') {
        toast.success('Customização aprovada com sucesso!');
      } else {
        toast.success('Customização rejeitada.');
      }
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar customização:', error);
      toast.error('Erro ao processar validação técnica');
    }
  });
}
