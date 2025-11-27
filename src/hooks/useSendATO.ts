import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendATOInput {
  atoId: string;
  discountPercentage: number;
  sendEmail: boolean;
  generatePDF: boolean;
  recipientEmail?: string;
  emailSubject?: string;
  emailMessage?: string;
}

export function useSendATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendATOInput) => {
      const { atoId, discountPercentage, sendEmail, generatePDF, recipientEmail, emailSubject, emailMessage } = input;
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // 1. Buscar dados da ATO com contrato e cliente
      const { data: ato, error: fetchError } = await supabase
        .from('additional_to_orders')
        .select(`
          *,
          contract:contracts (
            *,
            client:clients (*),
            yacht_model:yacht_models (*)
          ),
          configurations:ato_configurations (*)
        `)
        .eq('id', atoId)
        .single();

      if (fetchError) throw fetchError;
      if (!ato) throw new Error('ATO não encontrada');

      // 2. Verificar se workflow está completo
      if (ato.workflow_status !== 'completed') {
        throw new Error('O workflow da ATO deve estar completo antes do envio ao cliente');
      }

      // 3. Calcular preço final com desconto
      const originalPrice = ato.price_impact || 0;
      const discountAmount = (originalPrice * discountPercentage) / 100;
      const finalPrice = originalPrice - discountAmount;

      // 4. Atualizar status para 'pending_approval' e salvar desconto
      const { error: updateError } = await supabase
        .from('additional_to_orders')
        .update({
          status: 'pending_approval',
          discount_percentage: discountPercentage,
          price_impact: finalPrice, // Atualizar com preço final
          requested_at: new Date().toISOString()
        })
        .eq('id', atoId);

      if (updateError) throw updateError;

      // Descontos agora gerenciados via workflow simplificado

      // 6. Se deve enviar email, chamar edge function
      if (sendEmail && recipientEmail) {
        // TODO: Criar edge function send-ato-email
        console.log('Enviando email da ATO:', {
          atoId,
          recipientEmail,
          emailSubject,
          emailMessage,
          generatePDF
        });

        // Por enquanto, apenas simular envio
        toast.info('Funcionalidade de envio de email será implementada em breve');
      }

      // 7. Se gerou PDF mas não enviou email (a ser implementado)
      if (generatePDF && !sendEmail) {
        // TODO: Gerar PDF da ATO
        console.log('Gerando PDF da ATO:', atoId);
        toast.info('Funcionalidade de geração de PDF será implementada em breve');
      }

      return { 
        ato, 
        emailSent: sendEmail, 
        pdfGenerated: generatePDF,
        discountApplied: discountPercentage,
        needsApproval: discountPercentage > 10 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['atos'] });
      queryClient.invalidateQueries({ queryKey: ['ato', data.ato.id] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      
      if (data.needsApproval) {
        toast.info(`ATO enviada! Desconto de ${data.discountApplied.toFixed(1)}% aguarda aprovação comercial.`);
      } else if (data.emailSent) {
        toast.success('ATO enviada ao cliente com sucesso!');
      } else {
        toast.success('ATO marcada como pendente de aprovação!');
      }
    },
    onError: (error: Error) => {
      console.error('Erro ao enviar ATO:', error);
      toast.error('Erro ao enviar ATO: ' + error.message);
    }
  });
}
