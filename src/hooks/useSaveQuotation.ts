import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateQuotationNumberWithVersion } from "@/lib/quotation-utils";
import { needsApproval } from "@/lib/approval-utils";
import { calculateQuotationStatus } from "@/lib/quotation-status-utils";
import { generateCustomizationCode } from "@/lib/customization-utils";
import { SelectedOption, Customization } from "./useConfigurationState";
import { calculateQuotationPricing } from "./quotations/useQuotationPricing";
import { validateQuotation } from "./quotations/useQuotationValidation";
import { useUserRole } from "./useUserRole";

interface SaveQuotationData {
  quotationId?: string; // ✅ NOVO: ID da cotação sendo editada
  yacht_model_id: string;
  base_price: number;
  base_delivery_days: number;
  selected_options: SelectedOption[];
  customizations: Customization[];
  client_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_cpf?: string;
  base_discount_percentage?: number;
  options_discount_percentage?: number;
  notes?: string;
}

export function useSaveQuotation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: userRoleData } = useUserRole();

  return useMutation({
    mutationFn: async (data: SaveQuotationData) => {
      if (!user) throw new Error("Usuário não autenticado");

      // ✅ VALIDAÇÃO: Validar dados antes de processar
      const validation = validateQuotation({
        yacht_model_id: data.yacht_model_id,
        client_name: data.client_name,
        client_email: data.client_email,
        baseDiscountPercentage: data.base_discount_percentage,
        optionsDiscountPercentage: data.options_discount_percentage,
        userRoles: userRoleData?.roles || [],
      });

      // Bloquear se houver erros de validação
      if (!validation.isValid) {
        throw new Error(validation.errors.join(". "));
      }

      // Avisos não bloqueiam mas são logados
      if (validation.warnings.length > 0) {
        console.log('⚠️ Avisos de validação:', validation.warnings);
      }

      // ✅ MODO EDIÇÃO: Atualizar cotação existente
      if (data.quotationId) {
        // Calcular pricing usando o hook extraído
        const pricing = calculateQuotationPricing({
          basePrice: data.base_price,
          baseDeliveryDays: data.base_delivery_days,
          selectedOptions: data.selected_options,
          baseDiscountPercentage: data.base_discount_percentage,
          optionsDiscountPercentage: data.options_discount_percentage,
        });

        // Validar se há erro de desconto
        if (pricing.error) {
          throw new Error(pricing.error);
        }

        // Usar os valores calculados
        const {
          totalOptionsPrice,
          baseDiscountAmount,
          finalBasePrice,
          optionsDiscountAmount,
          finalOptionsPrice,
          finalPrice,
          totalDeliveryDays,
          maxDeliveryImpact,
        } = pricing;

        const baseDiscountPercentage = data.base_discount_percentage || 0;
        const optionsDiscountPercentage = data.options_discount_percentage || 0;

        // Update quotation
        const { data: quotation, error } = await supabase
          .from("quotations")
          .update({
            yacht_model_id: data.yacht_model_id,
            base_price: data.base_price,
            base_discount_percentage: baseDiscountPercentage,
            final_base_price: finalBasePrice,
            total_options_price: totalOptionsPrice,
            options_discount_percentage: optionsDiscountPercentage,
            final_options_price: finalOptionsPrice,
            discount_amount: baseDiscountAmount + optionsDiscountAmount,
            discount_percentage: Math.max(baseDiscountPercentage, optionsDiscountPercentage),
            final_price: finalPrice,
            base_delivery_days: data.base_delivery_days,
            total_delivery_days: totalDeliveryDays,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.quotationId)
          .select()
          .single();
        
        if (error) throw error;

        // ✅ Extrair quotation_number para uso posterior
        const quotationNumber = quotation.quotation_number;

        // Delete old options
        await supabase
          .from("quotation_options")
          .delete()
          .eq('quotation_id', data.quotationId);
        
        // Insert new options
        if (data.selected_options.length > 0) {
          const quotationOptions = data.selected_options.map((opt) => ({
            quotation_id: data.quotationId,
            option_id: opt.option_id, // option_id sempre existe no SelectedOption
            quantity: opt.quantity,
            unit_price: opt.unit_price,
            total_price: opt.unit_price * opt.quantity,
            delivery_days_impact: opt.delivery_days_impact || 0,
          }));

          const { error: optionsError } = await supabase
            .from("quotation_options")
            .insert(quotationOptions);

          if (optionsError) throw optionsError;
        }

        // ✅ NOVO: Processar customizações em modo EDIÇÃO (memorial + opcionais)
        // Buscar dados dos opcionais para obter nomes
        const { data: optionsData } = await supabase
          .from('options')
          .select('id, name')
          .in('id', data.selected_options.map(o => o.option_id));

        const optionsMap = new Map(optionsData?.map(o => [o.id, o.name]) || []);

        if ((data.customizations && data.customizations.length > 0) || data.selected_options.some(opt => opt.customization_notes?.trim())) {
          // 1. Buscar customizações existentes ANTES de deletar
          const { data: existingCustomizations } = await supabase
            .from('quotation_customizations')
            .select('*')
            .eq('quotation_id', data.quotationId);

          const approvedCustomizations = existingCustomizations?.filter(
            c => c.status === 'approved'
          ) || [];

          const newCustomizationKeys = data.customizations.map(
            c => `${c.memorial_item_id || 'free'}-${c.item_name}`
          );

          const removedApprovedCustomizations = approvedCustomizations.filter(
            c => !newCustomizationKeys.includes(`${c.id || 'free'}-${c.item_name}`)
          );

          if (removedApprovedCustomizations.length > 0) {
            console.warn('Customizações aprovadas removidas:', removedApprovedCustomizations);
          }

          // ✅ NOVO: Gerar próxima sequência baseada nos códigos existentes (antes de deletar)
          const existingCodes = existingCustomizations?.map(c => c.customization_code).filter(Boolean) || [];
          let maxSequence = 0;
          existingCodes.forEach(code => {
            const match = code?.match(/-CUS-(\d+)$/);
            if (match) {
              maxSequence = Math.max(maxSequence, parseInt(match[1]));
            }
          });
          let nextSequence = maxSequence + 1;

          // 2. Deletar customizações antigas
          await supabase
            .from("quotation_customizations")
            .delete()
            .eq('quotation_id', data.quotationId);

          // 3. Inserir novas customizações preservando status das aprovadas
          // 3a. Customizações de memorial
          const memorialCustomizationsData = (data.customizations || []).map((customization) => {
              // Verificar se é uma customização que já estava aprovada
              const existingApproved = existingCustomizations?.find(c => {
                // Para customizações de memorial
                if (customization.memorial_item_id && c.memorial_item_id) {
                  return c.memorial_item_id === customization.memorial_item_id && c.status === 'approved';
                }
                // Para customizações livres ou sem memorial_item_id
                return c.item_name === customization.item_name && c.status === 'approved';
              });

              const status = existingApproved ? 'approved' : 'pending';
              const workflow_status = existingApproved ? 'approved' : 'pending_pm_review';

              // ✅ Usar código existente OU gerar novo baseado na sequência em memória
              let code: string;
              if (existingApproved?.customization_code) {
                code = existingApproved.customization_code;
              } else {
                code = `${quotationNumber}-CUS-${String(nextSequence).padStart(3, '0')}`;
                nextSequence++;
              }

              return {
                quotation_id: data.quotationId,
                memorial_item_id: customization.memorial_item_id?.startsWith('free-') 
                  ? null 
                  : customization.memorial_item_id,
                item_name: customization.item_name,
                customization_code: code,
                notes: customization.notes,
                quantity: customization.quantity || null,
                file_paths: customization.image_url ? [customization.image_url] : (existingApproved?.file_paths || []),
                status,
                workflow_status,
                // ✅ PRESERVAR TODOS OS CAMPOS TÉCNICOS SE APROVADO
                pm_final_price: existingApproved?.pm_final_price || 0,
                pm_final_delivery_impact_days: existingApproved?.pm_final_delivery_impact_days || 0,
                pm_final_notes: existingApproved?.pm_final_notes || null,
                pm_scope: existingApproved?.pm_scope || null,
                engineering_hours: existingApproved?.engineering_hours || 0,
                engineering_notes: existingApproved?.engineering_notes || null,
                supply_cost: existingApproved?.supply_cost || 0,
                supply_lead_time_days: existingApproved?.supply_lead_time_days || 0,
                supply_notes: existingApproved?.supply_notes || null,
                supply_items: existingApproved?.supply_items || [],
                additional_cost: existingApproved?.additional_cost || 0,
                delivery_impact_days: existingApproved?.delivery_impact_days || 0,
                reviewed_by: existingApproved?.reviewed_by || null,
                reviewed_at: existingApproved?.reviewed_at || null,
                created_at: existingApproved?.created_at || new Date().toISOString(),
                workflow_audit: existingApproved?.workflow_audit || [],
                option_id: null
              };
            });

          // 3b. Customizações de opcionais
          const optionsWithCustomization = data.selected_options.filter(
            opt => opt.customization_notes && opt.customization_notes.trim()
          );

          const optionCustomizationsData = optionsWithCustomization.map((opt) => {
              const optionName = optionsMap.get(opt.option_id) || 'Opcional';
              
              const existingApproved = existingCustomizations?.find(
                c => c.option_id === opt.option_id && c.status === 'approved'
              );

              const status = existingApproved ? 'approved' : 'pending';
              const workflow_status = existingApproved ? 'approved' : 'pending_pm_review';

              let code: string;
              if (existingApproved?.customization_code) {
                code = existingApproved.customization_code;
              } else {
                code = `${quotationNumber}-CUS-${String(nextSequence).padStart(3, '0')}`;
                nextSequence++;
              }

              return {
                quotation_id: data.quotationId,
                option_id: opt.option_id,
                memorial_item_id: null,
                item_name: `Customização: ${optionName}`,
                customization_code: code,
                notes: opt.customization_notes,
                status,
                workflow_status,
                quantity: null,
                file_paths: existingApproved?.file_paths || [],
                pm_final_price: existingApproved?.pm_final_price || 0,
                pm_final_delivery_impact_days: existingApproved?.pm_final_delivery_impact_days || 0,
                pm_final_notes: existingApproved?.pm_final_notes || null,
                pm_scope: existingApproved?.pm_scope || null,
                engineering_hours: existingApproved?.engineering_hours || 0,
                engineering_notes: existingApproved?.engineering_notes || null,
                supply_cost: existingApproved?.supply_cost || 0,
                supply_lead_time_days: existingApproved?.supply_lead_time_days || 0,
                supply_notes: existingApproved?.supply_notes || null,
                supply_items: existingApproved?.supply_items || [],
                additional_cost: existingApproved?.additional_cost || 0,
                delivery_impact_days: existingApproved?.delivery_impact_days || 0,
                reviewed_by: existingApproved?.reviewed_by || null,
                reviewed_at: existingApproved?.reviewed_at || null,
                created_at: existingApproved?.created_at || new Date().toISOString(),
                workflow_audit: existingApproved?.workflow_audit || []
              };
            });

          // Combinar ambos os tipos de customizações
          const customizationsDataWithCodes = [...memorialCustomizationsData, ...optionCustomizationsData];

          const { data: insertedCustomizations, error: customizationsError } = await supabase
            .from("quotation_customizations")
            .insert(customizationsDataWithCodes)
            .select('id, item_name, memorial_item_id, option_id, quantity, notes, customization_code, status, workflow_status');

          if (customizationsError) {
            console.error('Erro ao inserir customizações:', customizationsError);
            throw customizationsError;
          }

          // 4. Determinar novo status baseado nas mudanças
          let newQuotationStatus = quotation.status;
          
          const hasNewPendingCustomizations = insertedCustomizations?.some((c: any) => {
            const wasApproved = existingCustomizations?.find((ec: any) => {
              if (c.option_id && ec.option_id) {
                return ec.option_id === c.option_id && ec.status === 'approved';
              }
              if (c.memorial_item_id && ec.memorial_item_id) {
                return ec.memorial_item_id === c.memorial_item_id && ec.status === 'approved';
              }
              return ec.item_name === c.item_name && ec.status === 'approved';
            });
            
            return !wasApproved;
          }) || false;

          if (removedApprovedCustomizations.length > 0) {
            newQuotationStatus = 'draft';
          } else if (hasNewPendingCustomizations) {
            newQuotationStatus = 'pending_technical_approval';
            
            const newCustomizations = insertedCustomizations?.filter((c: any) => {
              const wasApproved = existingCustomizations?.find((ec: any) => {
                if (c.option_id && ec.option_id) {
                  return ec.option_id === c.option_id && ec.status === 'approved';
                }
                if (c.memorial_item_id && ec.memorial_item_id) {
                  return ec.memorial_item_id === c.memorial_item_id && ec.status === 'approved';
                }
                return ec.item_name === c.item_name && ec.status === 'approved';
              });
              
              return !wasApproved;
            });
            
            
            if (newCustomizations && newCustomizations.length > 0) {
              const technicalApprovals = newCustomizations.map((customization: any) => ({
                quotation_id: data.quotationId,
                approval_type: 'technical' as const,
                requested_by: user.id,
                status: 'pending' as const,
                request_details: {
                  customization_id: customization.id,
                  customization_code: customization.customization_code,
                  customization_item_name: customization.item_name,
                  memorial_item_id: customization.memorial_item_id,
                  option_id: customization.option_id || null,
                  quantity: customization.quantity || 1,
                  notes: customization.notes || '',
                  is_free_customization: !customization.memorial_item_id && !customization.option_id
                },
                notes: customization.option_id
                  ? `Customização de opcional: ${customization.item_name}`
                  : (!customization.memorial_item_id
                     ? `Customização livre adicionada: ${customization.item_name}`
                     : `Customização solicitada: ${customization.item_name}`)
              }));

              // Customizações agora usam workflow simplificado via customization_workflow_steps
            }
          }

          // 5. Atualizar status da cotação (se necessário)
          if (newQuotationStatus !== quotation.status) {
            await supabase
              .from('quotations')
              .update({ 
                status: newQuotationStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.quotationId);
          }

          console.log(`✅ Customizações processadas. Status: ${newQuotationStatus}`);
        }
        
        return quotation;
      }

      // ✅ MODO CRIAÇÃO: Criar nova cotação
      // 1. Create or get client
      let clientId = data.client_id;

      if (!clientId) {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: data.client_name,
            email: data.client_email || null,
            phone: data.client_phone || null,
            cpf: data.client_cpf || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const quotationNumber = generateQuotationNumberWithVersion(1);
      
      // Calcular pricing usando o hook extraído
      const pricing = calculateQuotationPricing({
        basePrice: data.base_price,
        baseDeliveryDays: data.base_delivery_days,
        selectedOptions: data.selected_options,
        baseDiscountPercentage: data.base_discount_percentage,
        optionsDiscountPercentage: data.options_discount_percentage,
      });

      // Validar se há erro de desconto
      if (pricing.error) {
        throw new Error(pricing.error);
      }

      // Usar os valores calculados
      const {
        totalOptionsPrice,
        baseDiscountAmount,
        finalBasePrice,
        optionsDiscountAmount,
        finalOptionsPrice,
        finalPrice,
        totalDeliveryDays,
        maxDeliveryImpact,
      } = pricing;

      const baseDiscountPercentage = data.base_discount_percentage || 0;
      const optionsDiscountPercentage = data.options_discount_percentage || 0;

      // Determine if approval is needed
      const requiresApproval = needsApproval(baseDiscountPercentage, optionsDiscountPercentage);
      const hasCustomizations = data.customizations && data.customizations.length > 0;
      
      // Calculate initial status based on approvals needed
      const initialStatus = calculateQuotationStatus({
        hasDiscounts: baseDiscountPercentage > 0 || optionsDiscountPercentage > 0,
        baseDiscount: baseDiscountPercentage,
        optionsDiscount: optionsDiscountPercentage,
        hasCustomizations,
        commercialApproved: !requiresApproval,
        technicalApproved: !hasCustomizations,
        isExpired: false,
        currentStatus: 'draft'
      });

      // 2. Create quotation
      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .insert({
          quotation_number: quotationNumber,
          yacht_model_id: data.yacht_model_id,
          client_id: clientId,
          client_name: data.client_name,
          client_email: data.client_email || null,
          client_phone: data.client_phone || null,
          sales_representative_id: user.id,
          status: initialStatus,
          base_price: data.base_price,
          base_discount_percentage: baseDiscountPercentage,
          final_base_price: finalBasePrice,
          base_delivery_days: data.base_delivery_days,
          total_options_price: totalOptionsPrice,
          options_discount_percentage: optionsDiscountPercentage,
          final_options_price: finalOptionsPrice,
          total_customizations_price: 0,
          discount_amount: baseDiscountAmount + optionsDiscountAmount,
          discount_percentage: Math.max(baseDiscountPercentage, optionsDiscountPercentage),
          final_price: finalPrice,
          total_delivery_days: totalDeliveryDays,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        } as any)
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Array para armazenar todas as customizações criadas (memorial + opcionais)
      let createdCustomizations: any[] = [];

      // 3. Create quotation options
      if (data.selected_options.length > 0) {
        const quotationOptions = data.selected_options.map((opt) => ({
          quotation_id: quotation.id,
          option_id: opt.option_id,
          quantity: opt.quantity,
          unit_price: opt.unit_price,
          total_price: opt.unit_price * opt.quantity,
          delivery_days_impact: opt.delivery_days_impact || 0,
        }));

        const { error: optionsError } = await supabase
          .from("quotation_options")
          .insert(quotationOptions);

        if (optionsError) throw optionsError;

        // ✅ NOVO: Criar customizações para opcionais que têm notas
        const optionsWithCustomization = data.selected_options.filter(
          opt => opt.customization_notes && opt.customization_notes.trim()
        );

        if (optionsWithCustomization.length > 0) {
          // ✅ Gerar códigos sequenciais em memória
          let sequence = 1;
          const optionCustomizationsWithCodes = optionsWithCustomization.map((opt) => {
            const code = `${quotationNumber}-CUS-${String(sequence).padStart(3, '0')}`;
            sequence++;
            return {
              quotation_id: quotation.id,
              option_id: opt.option_id,
              memorial_item_id: null,
              item_name: `Customização de Opcional`,
              customization_code: code,
              notes: opt.customization_notes,
              status: 'pending',
              workflow_status: 'pending_pm_review'
            };
          });

          const { data: insertedOptionCustomizations, error: optionCustomizationsError } = await supabase
            .from("quotation_customizations")
            .insert(optionCustomizationsWithCodes)
            .select('id, item_name, option_id, notes, customization_code');

          if (optionCustomizationsError) {
            console.error('Erro ao criar customizações de opcionais:', optionCustomizationsError);
            throw optionCustomizationsError;
          }

          // Adicionar ao array de customizações criadas para criar approvals depois
          createdCustomizations.push(...(insertedOptionCustomizations || []));
          
          // ✅ Atualizar sequência para próximas customizações (de memorial)
          if (data.customizations.length > 0) {
            // Continue a sequência para customizações de memorial
          }
        }
      }

      // 4. Create customizations if any and store their IDs
      if (data.customizations.length > 0) {
        // ✅ Buscar última sequência se já existirem customizações de opcionais
        const { data: existingCodes } = await supabase
          .from('quotation_customizations')
          .select('customization_code')
          .eq('quotation_id', quotation.id)
          .like('customization_code', `${quotationNumber}-CUS-%`)
          .order('created_at', { ascending: false })
          .limit(1);
        
        let sequence = 1;
        if (existingCodes && existingCodes.length > 0 && existingCodes[0].customization_code) {
          const match = existingCodes[0].customization_code.match(/-CUS-(\d+)$/);
          if (match) {
            sequence = parseInt(match[1]) + 1;
          }
        }

        // Gerar códigos sequenciais em memória
        const customizationsDataWithCodes = data.customizations.map((customization) => {
          const code = `${quotationNumber}-CUS-${String(sequence).padStart(3, '0')}`;
          sequence++;
          return {
            quotation_id: quotation.id,
            memorial_item_id: customization.memorial_item_id?.startsWith('free-') 
              ? null 
              : customization.memorial_item_id,
            item_name: customization.item_name,
            customization_code: code,
            notes: customization.notes,
            quantity: customization.quantity || null,
            file_paths: customization.image_url ? [customization.image_url] : [],
          };
        });

        const { data: insertedCustomizations, error: customizationsError } = await supabase
          .from("quotation_customizations")
          .insert(customizationsDataWithCodes)
          .select('id, item_name, memorial_item_id, quantity, notes, customization_code');

        if (customizationsError) throw customizationsError;
        createdCustomizations = insertedCustomizations || [];
      }

      // Descontos e customizações agora são gerenciados via workflow simplificado

      return quotation;
    },
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      
      const statusMessages = {
        'pending_commercial_approval': 'criada e enviada para aprovação comercial',
        'pending_technical_approval': 'criada e enviada para validação técnica',
        'ready_to_send': 'criada e pronta para envio',
        'draft': 'salva como rascunho'
      };
      
      const statusText = statusMessages[quotation.status as keyof typeof statusMessages] || 'salva com sucesso';
      const message = `Cotação ${quotation.quotation_number} ${statusText}!`;
      
      toast({
        title: "Sucesso!",
        description: message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar cotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
