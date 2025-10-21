import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { generateQuotationNumber } from "@/lib/quotation-utils";
import { SelectedOption } from "./useConfigurationState";

interface SaveQuotationData {
  yacht_model_id: string;
  base_price: number;
  base_delivery_days: number;
  selected_options: SelectedOption[];
  client_name: string;
  client_email?: string;
  client_phone?: string;
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

      const finalPrice = data.base_price + totalOptionsPrice;
      const totalDeliveryDays = data.base_delivery_days + maxDeliveryImpact;

      // Create quotation
      const { data: quotation, error: quotationError } = await supabase
        .from("quotations")
        .insert({
          quotation_number: quotationNumber,
          yacht_model_id: data.yacht_model_id,
          client_name: data.client_name,
          client_email: data.client_email || null,
          client_phone: data.client_phone || null,
          sales_representative_id: user.id,
          status: "draft",
          base_price: data.base_price,
          base_delivery_days: data.base_delivery_days,
          total_options_price: totalOptionsPrice,
          total_customizations_price: 0,
          discount_amount: 0,
          discount_percentage: 0,
          final_price: finalPrice,
          total_delivery_days: totalDeliveryDays,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        })
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

      return quotation;
    },
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: "Cotação salva com sucesso!",
        description: `Número: ${quotation.quotation_number}`,
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
