import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateQuotationNumber } from "@/lib/quotation-utils";
import { needsApproval } from "@/lib/approval-utils";
import { calculateQuotationStatus } from "@/lib/quotation-status-utils";
import { SelectedOption, Customization } from "./useConfigurationState";

interface SaveQuotationData {
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

  return useMutation({
    mutationFn: async (data: SaveQuotationData) => {
      if (!user) throw new Error("Usuário não autenticado");

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

      const quotationNumber = generateQuotationNumber();
      
      // Calculate totals
      const totalOptionsPrice = data.selected_options.reduce(
        (sum, opt) => sum + opt.unit_price * opt.quantity,
        0
      );
      
      const maxDeliveryImpact = data.selected_options.reduce(
        (max, opt) => Math.max(max, opt.delivery_days_impact || 0),
        0
      );

      // Calculate discounted prices
      const baseDiscountPercentage = data.base_discount_percentage || 0;
      const optionsDiscountPercentage = data.options_discount_percentage || 0;
      
      const baseDiscountAmount = data.base_price * (baseDiscountPercentage / 100);
      const finalBasePrice = data.base_price - baseDiscountAmount;
      
      const optionsDiscountAmount = totalOptionsPrice * (optionsDiscountPercentage / 100);
      const finalOptionsPrice = totalOptionsPrice - optionsDiscountAmount;

      const finalPrice = finalBasePrice + finalOptionsPrice;
      const totalDeliveryDays = data.base_delivery_days + maxDeliveryImpact;

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
      }

      // 4. Create customizations if any and store their IDs
      let createdCustomizations: any[] = [];
      if (data.customizations.length > 0) {
        const customizationsData = data.customizations.map((customization) => ({
          quotation_id: quotation.id,
          memorial_item_id: customization.memorial_item_id?.startsWith('free-') 
            ? null 
            : customization.memorial_item_id,
          item_name: customization.item_name,
          notes: customization.notes,
          quantity: customization.quantity || null,
          file_paths: customization.image_url ? [customization.image_url] : [],
        }));

        const { data: insertedCustomizations, error: customizationsError } = await supabase
          .from("quotation_customizations")
          .insert(customizationsData)
          .select('id, item_name, memorial_item_id, quantity, notes');

        if (customizationsError) throw customizationsError;
        createdCustomizations = insertedCustomizations || [];
      }

      // 5. Create individual commercial approval requests
      // Base discount approval (if > 10%)
      if (baseDiscountPercentage > 10) {
        const { error: baseApprovalError } = await supabase
          .from("approvals")
          .insert({
            quotation_id: quotation.id,
            approval_type: 'commercial',
            requested_by: user.id,
            status: 'pending',
            request_details: {
              discount_type: 'base',
              discount_percentage: baseDiscountPercentage,
              discount_amount: baseDiscountAmount,
              original_price: data.base_price,
              final_price: finalBasePrice
            },
            notes: `Desconto de ${baseDiscountPercentage}% sobre o valor base do iate`
          });

        if (baseApprovalError) throw baseApprovalError;
      }

      // Options discount approval (if > 8%)
      if (optionsDiscountPercentage > 8) {
        const { error: optionsApprovalError } = await supabase
          .from("approvals")
          .insert({
            quotation_id: quotation.id,
            approval_type: 'commercial',
            requested_by: user.id,
            status: 'pending',
            request_details: {
              discount_type: 'options',
              discount_percentage: optionsDiscountPercentage,
              discount_amount: optionsDiscountAmount,
              original_price: totalOptionsPrice,
              final_price: finalOptionsPrice
            },
            notes: `Desconto de ${optionsDiscountPercentage}% sobre os opcionais`
          });

        if (optionsApprovalError) throw optionsApprovalError;
      }

      // 6. Create individual technical approval for EACH customization with customization_id
      if (hasCustomizations && createdCustomizations.length > 0) {
        const technicalApprovals = createdCustomizations.map((customization) => ({
          quotation_id: quotation.id,
          approval_type: 'technical' as const,
          requested_by: user.id,
          status: 'pending' as const,
          request_details: {
            customization_id: customization.id, // ✅ Adicionar ID da customização
            customization_item_name: customization.item_name,
            memorial_item_id: customization.memorial_item_id,
            quantity: customization.quantity || 1,
            notes: customization.notes || '',
            is_optional: false,
            is_free_customization: !customization.memorial_item_id
          },
          notes: !customization.memorial_item_id
            ? `Customização livre: ${customization.item_name}`
            : `Customização solicitada: ${customization.item_name}`
        }));

        const { error: technicalApprovalError } = await supabase
          .from("approvals")
          .insert(technicalApprovals);

        if (technicalApprovalError) throw technicalApprovalError;
      }

      return quotation;
    },
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-count"] });
      
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
