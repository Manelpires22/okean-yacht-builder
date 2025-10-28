import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateNextVersionNumber } from "@/lib/quotation-utils";

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

      // 2. Gerar novo número de cotação com versão incrementada
      const newVersion = (originalQuotation.version || 1) + 1;
      const newQuotationNumber = generateNextVersionNumber(
        originalQuotation.quotation_number,
        newVersion
      );

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
        const customizationsToInsert = originalQuotation.quotation_customizations.map((custom: any) => {
          const isApproved = custom.status === 'approved';
          
          return {
            quotation_id: newQuotation.id,
            memorial_item_id: custom.memorial_item_id,
            item_name: custom.item_name,
            quantity: custom.quantity,
            notes: custom.notes,
            file_paths: custom.file_paths,
            
            // ✅ PRESERVAR STATUS SE APROVADO
            status: isApproved ? 'approved' : 'pending',
            workflow_status: isApproved ? 'approved' : 'pending_pm_review',
            
            // ✅ COPIAR DADOS TÉCNICOS SE APROVADO
            additional_cost: isApproved ? custom.additional_cost : 0,
            delivery_impact_days: isApproved ? custom.delivery_impact_days : 0,
            engineering_hours: isApproved ? custom.engineering_hours : 0,
            engineering_notes: isApproved ? custom.engineering_notes : null,
            supply_cost: isApproved ? custom.supply_cost : 0,
            supply_lead_time_days: isApproved ? custom.supply_lead_time_days : 0,
            supply_items: isApproved ? custom.supply_items : [],
            supply_notes: isApproved ? custom.supply_notes : null,
            planning_window_start: isApproved ? custom.planning_window_start : null,
            planning_delivery_impact_days: isApproved ? custom.planning_delivery_impact_days : 0,
            planning_notes: isApproved ? custom.planning_notes : null,
            pm_final_price: isApproved ? custom.pm_final_price : 0,
            pm_final_delivery_impact_days: isApproved ? custom.pm_final_delivery_impact_days : 0,
            pm_final_notes: isApproved ? custom.pm_final_notes : null,
            pm_scope: isApproved ? custom.pm_scope : null,
            
            // Copiar metadados de workflow
            workflow_audit: isApproved ? custom.workflow_audit : [],
            reviewed_by: isApproved ? custom.reviewed_by : null,
            reviewed_at: isApproved ? custom.reviewed_at : null,
          };
        });

        const { error: customizationsError, data: newCustomizations } = await supabase
          .from('quotation_customizations')
          .insert(customizationsToInsert)
          .select();

        if (customizationsError) throw customizationsError;
        
        // ✅ COPIAR WORKFLOW STEPS PARA CUSTOMIZAÇÕES APROVADAS
        if (newCustomizations) {
          for (let i = 0; i < originalQuotation.quotation_customizations.length; i++) {
            const originalCustom = originalQuotation.quotation_customizations[i];
            const newCustom = newCustomizations[i];
            
            if (originalCustom.status === 'approved') {
              // Buscar steps do workflow original
              const { data: originalSteps } = await supabase
                .from('customization_workflow_steps')
                .select('*')
                .eq('customization_id', originalCustom.id)
                .order('created_at', { ascending: true });
              
              if (originalSteps && originalSteps.length > 0) {
                // Copiar steps como 'completed'
                const stepsToInsert = originalSteps.map(step => ({
                  customization_id: newCustom.id,
                  step_type: step.step_type,
                  status: 'completed',
                  assigned_to: step.assigned_to,
                  response_data: step.response_data,
                  notes: `${step.notes || ''} (Copiado da v${originalQuotation.version})`.trim(),
                  completed_at: step.completed_at || step.updated_at
                }));
                
                const { error: stepsError } = await supabase
                  .from('customization_workflow_steps')
                  .insert(stepsToInsert);
                
                if (stepsError) {
                  console.error('Erro ao copiar workflow steps:', stepsError);
                }
              }
            }
          }
        }
      }

      return newQuotation;
    },
    onSuccess: (newQuotation) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['customization-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['quotation-customizations-workflow'] });
      toast.success(`Revisão ${newQuotation.quotation_number} criada com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar revisão:', error);
      toast.error('Erro ao criar revisão: ' + error.message);
    }
  });
}
