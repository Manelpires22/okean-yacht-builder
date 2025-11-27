import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Quotation {
  id: string;
  quotation_number: string;
  yacht_model_id: string;
  client_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  sales_representative_id: string;
  status: string;
  base_price: number;
  base_delivery_days: number;
  total_options_price: number;
  total_customizations_price: number;
  discount_amount: number;
  discount_percentage: number;
  final_price: number;
  total_delivery_days: number;
  valid_until: string;
  created_at: string;
  updated_at: string;
}

export function useQuotations() {
  return useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          yacht_models (
            name,
            code
          ),
          clients (
            name,
            email,
            company
          ),
          users!quotations_sales_representative_id_fkey (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ["quotations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          yacht_models (
            name,
            code,
            description,
            technical_specifications,
            image_url
          ),
          clients (
            name,
            email,
            phone,
            company
          ),
          users!quotations_sales_representative_id_fkey (
            full_name,
            email
          ),
        quotation_options (
          id,
          option_id,
          quantity,
          unit_price,
          total_price,
          delivery_days_impact,
          options (
            name,
            code,
            description
          )
        ),
          quotation_customizations (
            id,
            item_name,
            notes,
            quantity,
            status,
            workflow_status,
            additional_cost,
            delivery_impact_days,
            engineering_notes,
            file_paths,
            customization_code,
            memorial_item_id,
            option_id,
            pm_final_price,
            pm_final_delivery_impact_days
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: "Status atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Verificar se existe contrato associado
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("id, contract_number")
        .eq("quotation_id", quotationId)
        .maybeSingle();

      if (contractError) throw contractError;

      if (contract) {
        throw new Error(
          `Esta cotação já foi convertida em contrato (${contract.contract_number}) e não pode ser deletada.`
        );
      }

      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", quotationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: "Cotação deletada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar cotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDuplicateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Fetch original quotation
      const { data: original, error: fetchError } = await supabase
        .from("quotations")
        .select(`
          *,
          quotation_options (
            option_id,
            quantity,
            unit_price,
            total_price,
            delivery_days_impact
          )
        `)
        .eq("id", quotationId)
        .single();

      if (fetchError) throw fetchError;

      // Generate new quotation number
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const newQuotationNumber = `QT-${year}-${random}`;

      // Create new quotation (TypeScript error will be fixed after types regenerate)
      const { data: newQuotation, error: createError } = await supabase
        .from("quotations")
        .insert({
          quotation_number: newQuotationNumber,
          yacht_model_id: original.yacht_model_id,
          client_id: original.client_id,
          client_name: original.client_name,
          client_email: original.client_email,
          client_phone: original.client_phone,
          sales_representative_id: original.sales_representative_id,
          status: "draft",
          base_price: original.base_price,
          base_discount_percentage: 0,
          final_base_price: original.base_price,
          base_delivery_days: original.base_delivery_days,
          total_options_price: original.total_options_price,
          options_discount_percentage: 0,
          final_options_price: original.total_options_price,
          total_customizations_price: original.total_customizations_price,
          discount_amount: 0,
          discount_percentage: 0,
          final_price: original.base_price + original.total_options_price,
          total_delivery_days: original.total_delivery_days,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        } as any) // Temporary as any until types regenerate
        .select()
        .single();

      if (createError) throw createError;

      // Copy options
      if (original.quotation_options && original.quotation_options.length > 0) {
        const newOptions = original.quotation_options.map((opt: any) => ({
          quotation_id: newQuotation.id,
          option_id: opt.option_id,
          quantity: opt.quantity,
          unit_price: opt.unit_price,
          total_price: opt.total_price,
          delivery_days_impact: opt.delivery_days_impact,
        }));

        const { error: optionsError } = await supabase
          .from("quotation_options")
          .insert(newOptions);

        if (optionsError) throw optionsError;
      }

      return newQuotation;
    },
    onSuccess: (newQuotation) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: "Cotação duplicada com sucesso!",
        description: `Nova cotação: ${newQuotation.quotation_number}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao duplicar cotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
