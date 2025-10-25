import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateQuotationNumber } from "@/lib/quotation-utils";

export function useCreateRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (originalQuotationId: string) => {
      // 1. Buscar cotação original com todos os dados
      const { data: originalQuotation, error: fetchError } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_options (*),
          quotation_customizations (*)
        `)
        .eq('id', originalQuotationId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalQuotation) throw new Error('Cotação original não encontrada');

      // 2. Gerar novo número de cotação
      const newQuotationNumber = generateQuotationNumber();
      const newVersion = (originalQuotation.version || 1) + 1;

      // 3. Criar nova cotação (revisão)
      const { data: newQuotation, error: createError } = await supabase
        .from('quotations')
        .insert({
          quotation_number: newQuotationNumber,
          version: newVersion,
          parent_quotation_id: originalQuotationId,
          
          // Copiar dados do cliente
          client_id: originalQuotation.client_id,
          client_name: originalQuotation.client_name,
          client_email: originalQuotation.client_email,
          client_phone: originalQuotation.client_phone,
          
          // Copiar dados do modelo
          yacht_model_id: originalQuotation.yacht_model_id,
          base_price: originalQuotation.base_price,
          base_discount_percentage: originalQuotation.base_discount_percentage,
          final_base_price: originalQuotation.final_base_price,
          base_delivery_days: originalQuotation.base_delivery_days,
          
          // Copiar dados de opcionais
          total_options_price: originalQuotation.total_options_price,
          options_discount_percentage: originalQuotation.options_discount_percentage,
          final_options_price: originalQuotation.final_options_price,
          
          // Copiar customizações
          total_customizations_price: originalQuotation.total_customizations_price,
          
          // Copiar totais
          final_price: originalQuotation.final_price,
          total_delivery_days: originalQuotation.total_delivery_days,
          
          // Status sempre draft
          status: 'draft',
          
          // Nova validade (30 dias)
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          
          // Vendedor atual
          sales_representative_id: originalQuotation.sales_representative_id
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!newQuotation) throw new Error('Erro ao criar revisão');

      // 4. Copiar opcionais
      if (originalQuotation.quotation_options && originalQuotation.quotation_options.length > 0) {
        const optionsToInsert = originalQuotation.quotation_options.map((opt: any) => ({
          quotation_id: newQuotation.id,
          option_id: opt.option_id,
          quantity: opt.quantity,
          unit_price: opt.unit_price,
          total_price: opt.total_price,
          delivery_days_impact: opt.delivery_days_impact
        }));

        const { error: optionsError } = await supabase
          .from('quotation_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      // 5. Copiar customizações
      if (originalQuotation.quotation_customizations && originalQuotation.quotation_customizations.length > 0) {
        const customizationsToInsert = originalQuotation.quotation_customizations.map((custom: any) => ({
          quotation_id: newQuotation.id,
          memorial_item_id: custom.memorial_item_id,
          item_name: custom.item_name,
          quantity: custom.quantity,
          notes: custom.notes,
          file_paths: custom.file_paths,
          // Status volta para pending
          status: 'pending'
        }));

        const { error: customizationsError } = await supabase
          .from('quotation_customizations')
          .insert(customizationsToInsert);

        if (customizationsError) throw customizationsError;
      }

      return newQuotation;
    },
    onSuccess: (newQuotation) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success(`Revisão ${newQuotation.quotation_number} criada com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar revisão:', error);
      toast.error('Erro ao criar revisão: ' + error.message);
    }
  });
}
