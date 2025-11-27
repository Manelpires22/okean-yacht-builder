import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SelectedOptionInput {
  option_id: string;
  quantity: number;
  unit_price: number;
  delivery_days_impact?: number;
}

interface SaveOptionsInput {
  quotationId: string;
  selectedOptions: SelectedOptionInput[];
  isEditMode?: boolean;
}

interface SaveOptionsResult {
  success: boolean;
  insertedCount: number;
}

/**
 * Hook React Query para salvar opções de cotações
 * Usado em componentes que precisam de invalidação automática de cache
 */
export function useQuotationOptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveOptionsInput): Promise<SaveOptionsResult> => {
      return saveQuotationOptions(input);
    },

    onSuccess: () => {
      // Invalidar cache de quotations e quotation_options
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation-options"] });
    },

    onError: (error) => {
      console.error("Erro ao salvar opções da cotação:", error);
    },
  });
}

/**
 * Função utilitária para salvar opções de cotações
 * Pode ser usada diretamente dentro de outras mutations sem React Query
 */
export async function saveQuotationOptions(
  input: SaveOptionsInput
): Promise<SaveOptionsResult> {
  const { quotationId, selectedOptions, isEditMode = false } = input;

  // 1. Se modo edição, deletar opções antigas primeiro
  if (isEditMode) {
    const { error: deleteError } = await supabase
      .from("quotation_options")
      .delete()
      .eq("quotation_id", quotationId);

    if (deleteError) {
      console.error("Erro ao deletar opções antigas:", deleteError);
      throw deleteError;
    }
  }

  // 2. Se não há opções para inserir, retornar sucesso
  if (selectedOptions.length === 0) {
    return { success: true, insertedCount: 0 };
  }

  // 3. Preparar dados para inserção
  const quotationOptions = selectedOptions.map((opt) => ({
    quotation_id: quotationId,
    option_id: opt.option_id,
    quantity: opt.quantity,
    unit_price: opt.unit_price,
    total_price: opt.unit_price * opt.quantity,
    delivery_days_impact: opt.delivery_days_impact || 0,
  }));

  // 4. Inserir novas opções
  const { error: insertError } = await supabase
    .from("quotation_options")
    .insert(quotationOptions);

  if (insertError) {
    console.error("Erro ao inserir opções:", insertError);
    throw insertError;
  }

  return {
    success: true,
    insertedCount: selectedOptions.length,
  };
}
