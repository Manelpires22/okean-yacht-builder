import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSyncCustomizations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Get all approved technical approvals for this quotation
      const { data: approvedApprovals, error: approvalsError } = await supabase
        .from('approvals')
        .select('id, request_details, review_notes')
        .eq('quotation_id', quotationId)
        .eq('approval_type', 'technical')
        .eq('status', 'approved');

      if (approvalsError) throw approvalsError;

      if (!approvedApprovals || approvedApprovals.length === 0) {
        return { synced: 0 };
      }

      // For each approved approval, find and update the corresponding customization
      let syncedCount = 0;
      for (const approval of approvedApprovals) {
        const details = approval.request_details as any;
        const itemName = details?.customization_item_name;
        
        if (!itemName) continue;

        // Find pending customization with this name
        const { data: customizations } = await supabase
          .from('quotation_customizations')
          .select('id')
          .eq('quotation_id', quotationId)
          .eq('item_name', itemName)
          .eq('status', 'pending')
          .limit(1);

        if (customizations && customizations.length > 0) {
          const { error: updateError } = await supabase
            .from('quotation_customizations')
            .update({
              status: 'approved',
              additional_cost: details?.additional_cost || 0,
              delivery_impact_days: details?.delivery_impact_days || 0,
              engineering_notes: approval.review_notes || null
            })
            .eq('id', customizations[0].id);

          if (!updateError) {
            syncedCount++;
          }
        }
      }

      // Recalculate quotation totals
      const { data: allCustomizations } = await supabase
        .from('quotation_customizations')
        .select('additional_cost, delivery_impact_days, status')
        .eq('quotation_id', quotationId);

      if (allCustomizations) {
        const totalCustomizationsCost = allCustomizations
          .filter(c => c.status === 'approved')
          .reduce((sum, c) => sum + (c.additional_cost || 0), 0);
        
        const maxDeliveryImpact = allCustomizations
          .filter(c => c.status === 'approved')
          .reduce((max, c) => Math.max(max, c.delivery_impact_days || 0), 0);

        const { data: quotation } = await supabase
          .from('quotations')
          .select('final_base_price, final_options_price, base_delivery_days')
          .eq('id', quotationId)
          .maybeSingle();

        if (quotation) {
          const newFinalPrice = (quotation.final_base_price || 0) + (quotation.final_options_price || 0) + totalCustomizationsCost;
          const newTotalDeliveryDays = (quotation.base_delivery_days || 0) + maxDeliveryImpact;

          await supabase
            .from('quotations')
            .update({
              total_customizations_price: totalCustomizationsCost,
              total_delivery_days: newTotalDeliveryDays,
              final_price: newFinalPrice
            })
            .eq('id', quotationId);
        }
      }

      return { synced: syncedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation'] });
      
      if (result.synced > 0) {
        toast.success(`${result.synced} customização(ões) sincronizada(s) com sucesso!`);
      } else {
        toast.info('Nenhuma customização pendente para sincronizar');
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    }
  });
};
