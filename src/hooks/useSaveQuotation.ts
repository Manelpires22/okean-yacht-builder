import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateQuotationNumber } from "@/lib/quotation-utils";
import { needsApproval } from "@/lib/approval-utils";
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
      const initialStatus = requiresApproval ? "pending_approval" : "draft";

      // Create quotation (TypeScript error will be fixed after types regenerate)
      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .insert({
          quotation_number: quotationNumber,
          yacht_model_id: data.yacht_model_id,
          client_id: data.client_id || null,
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
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        } as any) // Temporary as any until types regenerate
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Create quotation options
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

      // Create customizations if any
      if (data.customizations.length > 0) {
        const customizationsData = data.customizations.map((customization) => ({
          quotation_id: quotation.id,
          memorial_item_id: customization.memorial_item_id,
          item_name: customization.item_name,
          notes: customization.notes,
          quantity: customization.quantity || null,
          file_paths: [], // Files will be added in future iteration
        }));

        const { error: customizationsError } = await supabase
          .from("quotation_customizations")
          .insert(customizationsData);

        if (customizationsError) throw customizationsError;
      }

      // Create approval request if needed
      if (requiresApproval) {
        const { error: approvalError } = await supabase
          .from("approvals")
          .insert({
            quotation_id: quotation.id,
            approval_type: 'discount',
            requested_by: user.id,
            status: 'pending',
            request_details: {
              base_discount_percentage: baseDiscountPercentage,
              options_discount_percentage: optionsDiscountPercentage,
              base_discount_amount: baseDiscountAmount,
              options_discount_amount: optionsDiscountAmount,
              original_base_price: data.base_price,
              original_options_price: totalOptionsPrice,
              final_base_price: finalBasePrice,
              final_options_price: finalOptionsPrice,
              final_price: finalPrice
            },
            notes: data.notes || null
          });

        if (approvalError) throw approvalError;
      }

      return quotation;
    },
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-count"] });
      
      const message = quotation.status === 'pending_approval' 
        ? `Cotação ${quotation.quotation_number} criada e enviada para aprovação!`
        : `Cotação ${quotation.quotation_number} salva com sucesso!`;
      
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
