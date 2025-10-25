import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendQuotationInput {
  quotationId: string;
  sendEmail: boolean;
  generatePDF: boolean;
  recipientEmail?: string;
  emailSubject?: string;
  emailMessage?: string;
}

export function useSendQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendQuotationInput) => {
      const { quotationId, sendEmail, recipientEmail, emailSubject, emailMessage } = input;

      // 1. Buscar dados completos da cotação
      const { data: quotation, error: fetchError } = await supabase
        .from('quotations')
        .select(`
          *,
          yacht_models (*),
          clients (*),
          users!quotations_sales_representative_id_fkey (*),
          quotation_options (
            *,
            options (*)
          ),
          quotation_customizations (*)
        `)
        .eq('id', quotationId)
        .single();

      if (fetchError) throw fetchError;
      if (!quotation) throw new Error('Cotação não encontrada');

      const currentStatus = quotation.status;

      // 2. Criar snapshot da cotação (congelar estado atual)
      const snapshot = {
        quotation_number: quotation.quotation_number,
        yacht_model: quotation.yacht_models,
        client: quotation.clients,
        sales_representative: quotation.users,
        base_price: quotation.base_price,
        final_base_price: quotation.final_base_price,
        base_discount_percentage: quotation.base_discount_percentage,
        options: quotation.quotation_options,
        options_discount_percentage: quotation.options_discount_percentage,
        final_options_price: quotation.final_options_price,
        customizations: quotation.quotation_customizations,
        total_price: quotation.final_price,
        base_delivery_days: quotation.base_delivery_days,
        total_delivery_days: quotation.total_delivery_days,
        valid_until: quotation.valid_until,
        created_at: quotation.created_at,
        snapshot_created_at: new Date().toISOString()
      };

      // 3. Atualizar status para 'sent' se draft ou ready_to_send
      const newStatus = ['draft', 'ready_to_send', 'pending_commercial_approval', 'pending_technical_approval'].includes(currentStatus) 
        ? 'sent' 
        : currentStatus;

      const { error: updateError } = await supabase
        .from('quotations')
        .update({
          status: newStatus,
          snapshot_json: snapshot
        })
        .eq('id', quotationId);

      if (updateError) throw updateError;

      // 4. Se deve enviar email, chamar edge function
      if (sendEmail && recipientEmail) {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-quotation-email',
          {
            body: {
              quotationId,
              recipientEmail,
              subject: emailSubject,
              message: emailMessage
            }
          }
        );

        if (emailError) {
          console.error('Erro ao enviar email:', emailError);
          throw new Error('Erro ao enviar email: ' + emailError.message);
        }

        return { quotation, emailSent: true, emailData };
      }

      return { quotation, emailSent: false };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotations', data.quotation.id] });
      
      if (data.emailSent) {
        toast.success('Proposta enviada por email com sucesso!');
      } else {
        toast.success('Proposta marcada como enviada!');
      }
    },
    onError: (error: Error) => {
      console.error('Erro ao enviar cotação:', error);
      toast.error('Erro ao enviar proposta: ' + error.message);
    }
  });
}
