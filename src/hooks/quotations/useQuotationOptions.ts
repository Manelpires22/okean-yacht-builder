import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dados de um opcional selecionado para salvamento
 * @interface SelectedOptionInput
 */
interface SelectedOptionInput {
  /** UUID do opcional no catálogo */
  option_id: string;
  /** Quantidade selecionada (deve ser > 0) */
  quantity: number;
  /** Preço unitário do opcional em BRL */
  unit_price: number;
  /** Impacto no prazo de entrega em dias */
  delivery_days_impact?: number;
}

/**
 * Dados de entrada para salvar opções de uma cotação
 * @interface SaveOptionsInput
 */
interface SaveOptionsInput {
  /** UUID da cotação */
  quotationId: string;
  /** Lista de opcionais selecionados */
  selectedOptions: SelectedOptionInput[];
  /** Se true, deleta opções antigas antes de inserir novas */
  isEditMode?: boolean;
}

/**
 * Resultado do salvamento de opções
 * @interface SaveOptionsResult
 */
interface SaveOptionsResult {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  /** Quantidade de opções inseridas */
  insertedCount: number;
}

/**
 * Salva os opcionais de uma cotação no banco de dados
 * 
 * @description
 * Função utilitária para persistir opcionais selecionados de uma cotação.
 * Pode ser usada diretamente em outras mutations ou isoladamente.
 * 
 * **Comportamento em modo edição:**
 * - Remove todas as opções existentes da cotação
 * - Insere as novas opções fornecidas
 * 
 * **Campos calculados automaticamente:**
 * - `total_price`: unit_price × quantity
 * 
 * @param {SaveOptionsInput} input - Dados de entrada
 * @param {string} input.quotationId - UUID da cotação
 * @param {SelectedOptionInput[]} input.selectedOptions - Opcionais a salvar
 * @param {boolean} [input.isEditMode=false] - Se deve limpar opções existentes
 * 
 * @returns {Promise<SaveOptionsResult>} Resultado da operação
 * @throws {Error} Se ocorrer erro ao deletar ou inserir no Supabase
 * 
 * @example
 * ```typescript
 * // Criar nova cotação com opcionais
 * const result = await saveQuotationOptions({
 *   quotationId: 'uuid-cotacao',
 *   selectedOptions: [
 *     { option_id: 'uuid-1', quantity: 2, unit_price: 5000 },
 *     { option_id: 'uuid-2', quantity: 1, unit_price: 10000, delivery_days_impact: 15 }
 *   ]
 * });
 * console.log(result.insertedCount); // 2
 * 
 * // Editar cotação existente (substitui opcionais)
 * await saveQuotationOptions({
 *   quotationId: 'uuid-cotacao',
 *   selectedOptions: newOptions,
 *   isEditMode: true
 * });
 * ```
 * 
 * @see {@link useQuotationOptions} - Hook React Query com invalidação de cache
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

/**
 * Hook React Query para salvar opcionais de cotações
 * 
 * @description
 * Wrapper de saveQuotationOptions com benefícios do React Query:
 * - Invalidação automática de cache após sucesso
 * - Estados de loading/error/success
 * - Retry automático em caso de falha
 * 
 * **Queries invalidadas:**
 * - `quotations` - Lista geral de cotações
 * - `quotation-options` - Opções específicas
 * 
 * @returns {UseMutationResult} Mutation do React Query
 * @returns {function} return.mutate - Função para executar a mutation
 * @returns {function} return.mutateAsync - Versão async para await
 * @returns {boolean} return.isPending - Se está executando
 * @returns {Error|null} return.error - Erro se houver
 * 
 * @example
 * ```typescript
 * function OptionSelector({ quotationId, selectedOptions }) {
 *   const { mutate: saveOptions, isPending } = useQuotationOptions();
 * 
 *   const handleSave = () => {
 *     saveOptions({
 *       quotationId,
 *       selectedOptions,
 *       isEditMode: true
 *     });
 *   };
 * 
 *   return (
 *     <Button onClick={handleSave} disabled={isPending}>
 *       {isPending ? 'Salvando...' : 'Salvar Opcionais'}
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @see {@link saveQuotationOptions} - Função utilitária de salvamento
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
