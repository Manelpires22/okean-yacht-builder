import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCreateRetroactiveApprovals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Buscar customizações aprovadas sem registro em approvals
      const { data: customizations, error: fetchError } = await supabase
        .from('quotation_customizations')
        .select(`
          id,
          quotation_id,
          item_name,
          option_id,
          additional_cost,
          delivery_impact_days,
          status,
          customization_code,
          reviewed_by,
          reviewed_at,
          created_at,
          quotations!inner(sales_representative_id, quotation_number)
        `)
        .in('status', ['approved', 'pending'])
        .not('option_id', 'is', null);

      if (fetchError) throw fetchError;

      if (!customizations || customizations.length === 0) {
        return { created: 0, message: 'Nenhuma customização sem aprovação encontrada' };
      }

      // Verificar quais já têm registro em approvals
      const { data: existingApprovals } = await supabase
        .from('approvals')
        .select('quotation_id, request_details')
        .eq('approval_type', 'technical');

      const existingMap = new Map(
        existingApprovals?.map(a => [
          `${a.quotation_id}-${(a.request_details as any)?.customization_item_name}`,
          true
        ]) || []
      );

      // Filtrar customizações sem registro
      const missingApprovals = customizations.filter(c => 
        !existingMap.has(`${c.quotation_id}-${c.item_name}`)
      );

      if (missingApprovals.length === 0) {
        return { created: 0, message: 'Todas as customizações já têm registro de aprovação' };
      }

      // Criar aprovações retroativas
      const approvalsToCreate = missingApprovals.map(c => ({
        quotation_id: c.quotation_id,
        approval_type: 'technical' as const,
        status: c.status as 'approved' | 'pending',
        requested_by: (c.quotations as any).sales_representative_id,
        requested_at: c.created_at,
        reviewed_by: c.status === 'approved' ? (c.reviewed_by || (c.quotations as any).sales_representative_id) : null,
        reviewed_at: c.status === 'approved' ? (c.reviewed_at || c.created_at) : null,
        request_details: {
          customization_id: c.id,
          customization_code: c.customization_code,
          customization_item_name: c.item_name,
          option_id: c.option_id,
          additional_cost: c.additional_cost || 0,
          delivery_impact_days: c.delivery_impact_days || 0
        },
        review_notes: c.status === 'approved' 
          ? 'Aprovação retroativa criada automaticamente pelo sistema'
          : null
      }));

      const { error: insertError } = await supabase
        .from('approvals')
        .insert(approvalsToCreate);

      if (insertError) throw insertError;

      return { 
        created: approvalsToCreate.length, 
        message: `${approvalsToCreate.length} aprovação(ões) retroativa(s) criada(s)` 
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
      
      if (result.created > 0) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar aprovações retroativas: ${error.message}`);
    }
  });
};
