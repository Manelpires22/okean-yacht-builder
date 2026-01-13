import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateQuotationNumberWithVersion } from "@/lib/quotation-utils";
import { needsApproval } from "@/lib/approval-utils";
import { calculateQuotationStatus } from "@/lib/quotation-status-utils";
import { generateCustomizationCode } from "@/lib/customization-utils";
import { SelectedOption, Customization, CommissionData, ClientData, TradeInData } from "./useConfigurationState";
import { calculateQuotationPricing } from "./quotations/useQuotationPricing";
import { validateQuotation } from "./quotations/useQuotationValidation";
import { useQuotationOptions } from "./quotations/useQuotationOptions";
import { useQuotationCustomizations } from "./quotations/useQuotationCustomizations";
import { useUserRole } from "./useUserRole";
import { useSystemConfig } from "./useSystemConfig";
import type { SimulatorPreloadData } from "@/types/simulator-preload";

interface SaveQuotationData {
  quotationId?: string;
  yacht_model_id: string;
  base_price: number;
  base_delivery_days: number;
  selected_options: SelectedOption[];
  selected_upgrades?: Array<{
    upgrade_id: string;
    memorial_item_id: string;
    name: string;
    price: number;
    delivery_days_impact: number;
    customization_notes?: string;
  }>;
  customizations: Customization[];
  client_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_cpf?: string;
  base_discount_percentage?: number;
  options_discount_percentage?: number;
  notes?: string;
  hull_number_id?: string;
  // Dados para integração com simulador
  commission_data?: CommissionData;
  client_data?: ClientData;
  trade_in_data?: TradeInData;
}

export interface SaveQuotationResult {
  quotation: any;
  simulatorData: SimulatorPreloadData;
}

// Funções auxiliares
function extractOptionsWithCustomization(selectedOptions: SelectedOption[]) {
  return selectedOptions
    .filter(opt => opt.customization_notes?.trim())
    .map(opt => ({
      option_id: opt.option_id,
      customization_notes: opt.customization_notes,
    }));
}

export function useSaveQuotation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: userRoleData } = useUserRole();
  const { data: systemConfig } = useSystemConfig();
  
  // Validade da cotação do config ou default 30 dias
  const validityDays = systemConfig?.quotation_validity_days ?? 30;
  
  // Hooks de mutation
  const optionsMutation = useQuotationOptions();
  const customizationsMutation = useQuotationCustomizations();

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
        // Calcular pricing usando o hook extraído (agora inclui upgrades!)
        const pricing = calculateQuotationPricing({
          basePrice: data.base_price,
          baseDeliveryDays: data.base_delivery_days,
          selectedOptions: data.selected_options,
          selectedUpgrades: data.selected_upgrades?.map(u => ({
            price: u.price,
            delivery_days_impact: u.delivery_days_impact,
          })),
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
          totalUpgradesPrice,
          baseDiscountAmount,
          finalBasePrice,
          optionsDiscountAmount,
          finalOptionsPrice,
          upgradesDiscountAmount,
          finalUpgradesPrice,
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
            discount_amount: baseDiscountAmount + optionsDiscountAmount + upgradesDiscountAmount,
            discount_percentage: Math.max(baseDiscountPercentage, optionsDiscountPercentage),
            final_price: finalPrice,
            base_delivery_days: data.base_delivery_days,
            total_delivery_days: totalDeliveryDays,
            hull_number_id: data.hull_number_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.quotationId)
          .select()
          .single();
        
        if (error) throw error;

        // ✅ Extrair quotation_number para uso posterior
        const quotationNumber = quotation.quotation_number;

        // Salvar opções usando hook mutation (modo edição)
        await optionsMutation.mutateAsync({
          quotationId: data.quotationId,
          selectedOptions: data.selected_options,
          isEditMode: true,
        });

        // ✅ Processar customizações (memorial + opcionais) usando hook mutation
        const optionsWithCustomization = extractOptionsWithCustomization(data.selected_options);

        if (data.customizations.length > 0 || optionsWithCustomization.length > 0) {
          const customizationsResult = await customizationsMutation.mutateAsync({
            quotationId: data.quotationId!,
            quotationNumber: quotation.quotation_number,
            customizations: data.customizations,
            optionsWithCustomization,
            isEditMode: true,
          });

          // Atualizar status da cotação se necessário
          if (customizationsResult.newQuotationStatus && 
              customizationsResult.newQuotationStatus !== quotation.status) {
            await supabase
              .from('quotations')
              .update({ 
                status: customizationsResult.newQuotationStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.quotationId);

            console.log(`✅ Status atualizado para: ${customizationsResult.newQuotationStatus}`);
          }

          console.log(`✅ Customizações processadas: ${customizationsResult.insertedCount} inseridas`);
        }

        // ✅ Salvar upgrades selecionados (modo edição)
        if (data.selected_upgrades && data.selected_upgrades.length > 0) {
          // Deletar upgrades existentes
          await supabase
            .from('quotation_upgrades')
            .delete()
            .eq('quotation_id', data.quotationId);

          // Inserir novos upgrades
          const upgradesData = data.selected_upgrades.map(u => ({
            quotation_id: data.quotationId!,
            upgrade_id: u.upgrade_id,
            memorial_item_id: u.memorial_item_id,
            price: u.price,
            delivery_days_impact: u.delivery_days_impact,
            customization_notes: u.customization_notes || null,
          }));

          const { error: upgradesError } = await supabase
            .from('quotation_upgrades')
            .insert(upgradesData);

          if (upgradesError) throw upgradesError;
        }
        
        // ✅ Buscar nome do modelo para retorno
        const { data: yachtModel } = await supabase
          .from('yacht_models')
          .select('name, code')
          .eq('id', data.yacht_model_id)
          .single();

        // Calcular customizações estimadas para o simulador
        const customizacoesEstimadas = 
          totalOptionsPrice + 
          totalUpgradesPrice + 
          (data.customizations?.reduce((sum, c) => sum + (c.pm_final_price || 0), 0) || 0);

        // Retornar cotação + dados para simulador
        const result: SaveQuotationResult = {
          quotation,
          simulatorData: {
            modelId: data.yacht_model_id,
            modelName: yachtModel?.name || '',
            modelCode: yachtModel?.code || '',
            originalBasePrice: data.base_price,
            faturamentoBruto: finalPrice,
            customizacoesEstimadas,
            commission: data.commission_data ? {
              id: data.commission_data.id,
              name: data.commission_data.name,
              percent: data.commission_data.percent,
              type: data.commission_data.type,
            } : undefined,
            client: data.client_data ? {
              id: data.client_data.id,
              name: data.client_data.name,
            } : undefined,
            tradeIn: data.trade_in_data?.hasTradeIn ? {
              hasTradeIn: true,
              tradeInBrand: data.trade_in_data.tradeInBrand,
              tradeInModel: data.trade_in_data.tradeInModel,
              tradeInYear: data.trade_in_data.tradeInYear,
              tradeInEntryValue: data.trade_in_data.tradeInEntryValue,
              tradeInRealValue: data.trade_in_data.tradeInRealValue,
            } : undefined,
            quotationId: quotation.id,
            quotationNumber: quotation.quotation_number,
          },
        };

        return result;
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
      
      // Calcular pricing usando o hook extraído (agora inclui upgrades!)
      const pricing = calculateQuotationPricing({
        basePrice: data.base_price,
        baseDeliveryDays: data.base_delivery_days,
        selectedOptions: data.selected_options,
        selectedUpgrades: data.selected_upgrades?.map(u => ({
          price: u.price,
          delivery_days_impact: u.delivery_days_impact,
        })),
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
        totalUpgradesPrice,
        baseDiscountAmount,
        finalBasePrice,
        optionsDiscountAmount,
        finalOptionsPrice,
        upgradesDiscountAmount,
        finalUpgradesPrice,
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
          discount_amount: baseDiscountAmount + optionsDiscountAmount + upgradesDiscountAmount,
          discount_percentage: Math.max(baseDiscountPercentage, optionsDiscountPercentage),
          final_price: finalPrice,
          total_delivery_days: totalDeliveryDays,
          valid_until: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          hull_number_id: data.hull_number_id || null,
        } as any)
        .select()
        .single();

      if (quotationError) throw quotationError;

      // 3. Create quotation options using mutation hook
      await optionsMutation.mutateAsync({
        quotationId: quotation.id,
        selectedOptions: data.selected_options,
        isEditMode: false,
      });

      // 4. Create customizations (memorial + opcionais) using mutation hook
      const optionsWithCustomization = extractOptionsWithCustomization(data.selected_options);

      if (data.customizations.length > 0 || optionsWithCustomization.length > 0) {
        await customizationsMutation.mutateAsync({
          quotationId: quotation.id,
          quotationNumber: quotationNumber,
          customizations: data.customizations,
          optionsWithCustomization,
          isEditMode: false,
        });
      }

      // 5. Salvar upgrades selecionados
      if (data.selected_upgrades && data.selected_upgrades.length > 0) {
        const upgradesData = data.selected_upgrades.map(u => ({
          quotation_id: quotation.id,
          upgrade_id: u.upgrade_id,
          memorial_item_id: u.memorial_item_id,
          price: u.price,
          delivery_days_impact: u.delivery_days_impact,
          customization_notes: u.customization_notes || null,
        }));

        const { error: upgradesError } = await supabase
          .from('quotation_upgrades')
          .insert(upgradesData);

        if (upgradesError) throw upgradesError;
      }

      // Descontos e customizações agora são gerenciados via workflow simplificado

      // ✅ Buscar nome do modelo para retorno
      const { data: yachtModel } = await supabase
        .from('yacht_models')
        .select('name, code')
        .eq('id', data.yacht_model_id)
        .single();

      // Calcular customizações estimadas para o simulador
      const customizacoesEstimadas = 
        totalOptionsPrice + 
        totalUpgradesPrice + 
        (data.customizations?.reduce((sum, c) => sum + (c.pm_final_price || 0), 0) || 0);

      // Retornar cotação + dados para simulador
      const result: SaveQuotationResult = {
        quotation,
        simulatorData: {
          modelId: data.yacht_model_id,
          modelName: yachtModel?.name || '',
          modelCode: yachtModel?.code || '',
          originalBasePrice: data.base_price,
          faturamentoBruto: finalPrice,
          customizacoesEstimadas,
          commission: data.commission_data ? {
            id: data.commission_data.id,
            name: data.commission_data.name,
            percent: data.commission_data.percent,
            type: data.commission_data.type,
          } : undefined,
          client: data.client_data ? {
            id: data.client_data.id,
            name: data.client_data.name,
          } : undefined,
          tradeIn: data.trade_in_data?.hasTradeIn ? {
            hasTradeIn: true,
            tradeInBrand: data.trade_in_data.tradeInBrand,
            tradeInModel: data.trade_in_data.tradeInModel,
            tradeInYear: data.trade_in_data.tradeInYear,
            tradeInEntryValue: data.trade_in_data.tradeInEntryValue,
            tradeInRealValue: data.trade_in_data.tradeInRealValue,
          } : undefined,
          quotationId: quotation.id,
          quotationNumber: quotationNumber,
        },
      };

      return result;
    },
    onSuccess: (result: SaveQuotationResult) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      
      const statusMessages = {
        'pending_commercial_approval': 'criada e enviada para aprovação comercial',
        'pending_technical_approval': 'criada e enviada para validação técnica',
        'ready_to_send': 'criada e pronta para envio',
        'draft': 'salva como rascunho'
      };
      
      const statusText = statusMessages[result.quotation.status as keyof typeof statusMessages] || 'salva com sucesso';
      const message = `Cotação ${result.quotation.quotation_number} ${statusText}!`;
      
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
