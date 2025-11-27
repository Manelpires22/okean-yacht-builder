import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para salvamento de customizações de cotações
 * Centraliza toda a lógica de:
 * - Geração de códigos sequenciais
 * - Preservação de dados aprovados em modo edição
 * - Determinação de workflow_status inicial
 */

/**
 * Dados de uma customização de memorial
 * @interface CustomizationInput
 */
interface CustomizationInput {
  /** Nome/descrição do item customizado */
  item_name: string;
  /** Notas/observações da customização */
  notes?: string;
  /** Quantidade (se aplicável) */
  quantity?: number;
  /** Custo adicional estimado em BRL */
  additional_cost?: number;
  /** Impacto estimado no prazo em dias */
  delivery_impact_days?: number;
  /** UUID do item de memorial (se vier do memorial) */
  memorial_item_id?: string;
  /** UUID do opcional (se customização de opcional) */
  option_id?: string;
  /** URL da imagem de referência */
  image_url?: string;
}

/**
 * Opcional que possui notas de customização
 * @interface OptionWithCustomization
 */
interface OptionWithCustomization {
  /** UUID do opcional */
  option_id: string;
  /** Notas de customização do opcional */
  customization_notes?: string;
}

/**
 * Dados de entrada para salvar customizações
 * @interface SaveCustomizationsInput
 */
interface SaveCustomizationsInput {
  /** UUID da cotação */
  quotationId: string;
  /** Número da cotação (ex: QT-2025-001-V1) para gerar códigos */
  quotationNumber: string;
  /** Lista de customizações de memorial */
  customizations: CustomizationInput[];
  /** Opcionais com notas de customização */
  optionsWithCustomization?: OptionWithCustomization[];
  /** Se true, preserva customizações aprovadas */
  isEditMode?: boolean;
}

/**
 * Resultado detalhado do salvamento de customizações
 * @interface SaveCustomizationsResult
 */
interface SaveCustomizationsResult {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  /** Total de customizações inseridas */
  insertedCount: number;
  /** Se há novas customizações pendentes de aprovação */
  hasNewPendingCustomizations: boolean;
  /** Quantidade de customizações aprovadas que foram removidas */
  removedApprovedCount: number;
  /** Novo status sugerido para a cotação */
  newQuotationStatus?: string;
  /** Lista das customizações criadas com códigos */
  createdCustomizations: Array<{
    id: string;
    item_name: string;
    customization_code: string;
    status: string;
    workflow_status: string;
  }>;
}

/**
 * Gera código sequencial para customização
 * 
 * @description
 * Formato: `{QUOTATION_NUMBER}-CUS-{SEQUENCE}`
 * Exemplo: `QT-2025-001-V1-CUS-001`
 * 
 * @param {string} quotationNumber - Número da cotação base
 * @param {number} sequence - Número sequencial (será padded com zeros)
 * @returns {string} Código formatado
 * 
 * @example
 * ```typescript
 * generateCode('QT-2025-001-V1', 1);  // 'QT-2025-001-V1-CUS-001'
 * generateCode('QT-2025-001-V1', 42); // 'QT-2025-001-V1-CUS-042'
 * ```
 */
function generateCode(quotationNumber: string, sequence: number): string {
  return `${quotationNumber}-CUS-${String(sequence).padStart(3, "0")}`;
}

/**
 * Extrai número sequencial de um código de customização
 * 
 * @param {string} code - Código completo da customização
 * @returns {number} Número sequencial extraído (0 se inválido)
 * 
 * @example
 * ```typescript
 * extractSequence('QT-2025-001-V1-CUS-042'); // 42
 * extractSequence('invalid-code');           // 0
 * ```
 */
function extractSequence(code: string): number {
  const match = code?.match(/-CUS-(\d+)$/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Salva customizações de memorial e opcionais de uma cotação
 * 
 * @description
 * Função complexa que gerencia o ciclo de vida de customizações:
 * 
 * **Em modo criação:**
 * - Gera códigos sequenciais para cada customização
 * - Define workflow_status inicial como 'pending_pm_review'
 * 
 * **Em modo edição:**
 * - Preserva dados técnicos de customizações já aprovadas
 * - Mantém códigos existentes de customizações aprovadas
 * - Detecta se customizações aprovadas foram removidas
 * - Recalcula status da cotação baseado nas mudanças
 * 
 * **Campos preservados de aprovadas:**
 * - pm_final_price, pm_final_delivery_impact_days, pm_final_notes
 * - engineering_hours, engineering_notes
 * - supply_cost, supply_lead_time_days, supply_notes, supply_items
 * - reviewed_by, reviewed_at, workflow_audit
 * 
 * @param {SaveCustomizationsInput} input - Dados de entrada
 * @returns {Promise<SaveCustomizationsResult>} Resultado detalhado
 * @throws {Error} Se ocorrer erro ao interagir com Supabase
 * 
 * @example
 * ```typescript
 * // Criar customizações em nova cotação
 * const result = await saveQuotationCustomizations({
 *   quotationId: 'uuid',
 *   quotationNumber: 'QT-2025-001-V1',
 *   customizations: [
 *     { item_name: 'Layout cabine', notes: 'Converter em escritório' }
 *   ],
 *   optionsWithCustomization: [
 *     { option_id: 'uuid-opt', customization_notes: 'Cor personalizada' }
 *   ]
 * });
 * 
 * // Editar cotação preservando aprovadas
 * const editResult = await saveQuotationCustomizations({
 *   quotationId: 'uuid',
 *   quotationNumber: 'QT-2025-001-V1',
 *   customizations: [...updatedCustomizations],
 *   isEditMode: true
 * });
 * 
 * if (editResult.removedApprovedCount > 0) {
 *   console.warn('Customizações aprovadas foram removidas!');
 * }
 * ```
 * 
 * @see {@link useQuotationCustomizations} - Hook React Query
 */
export async function saveQuotationCustomizations(
  input: SaveCustomizationsInput
): Promise<SaveCustomizationsResult> {
  const {
    quotationId,
    quotationNumber,
    customizations,
    optionsWithCustomization = [],
    isEditMode = false,
  } = input;

  // Filtrar opcionais que realmente têm notas de customização
  const optionsToProcess = optionsWithCustomization.filter(
    (opt) => opt.customization_notes?.trim()
  );

  // Se não há nada para processar, retornar
  if (customizations.length === 0 && optionsToProcess.length === 0) {
    return {
      success: true,
      insertedCount: 0,
      hasNewPendingCustomizations: false,
      removedApprovedCount: 0,
      createdCustomizations: [],
    };
  }

  let existingCustomizations: any[] = [];
  let approvedCustomizations: any[] = [];
  let maxSequence = 0;

  // =============================================
  // MODO EDIÇÃO: Buscar customizações existentes
  // =============================================
  if (isEditMode) {
    const { data: existing } = await supabase
      .from("quotation_customizations")
      .select("*")
      .eq("quotation_id", quotationId);

    existingCustomizations = existing || [];
    approvedCustomizations = existingCustomizations.filter(
      (c) => c.status === "approved"
    );

    // Extrair máxima sequência dos códigos existentes
    existingCustomizations.forEach((c) => {
      maxSequence = Math.max(maxSequence, extractSequence(c.customization_code));
    });

    // Deletar customizações antigas
    await supabase
      .from("quotation_customizations")
      .delete()
      .eq("quotation_id", quotationId);
  } else {
    // MODO CRIAÇÃO: Buscar última sequência se já existem customizações
    const { data: existingCodes } = await supabase
      .from("quotation_customizations")
      .select("customization_code")
      .eq("quotation_id", quotationId)
      .like("customization_code", `${quotationNumber}-CUS-%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingCodes?.length > 0) {
      maxSequence = extractSequence(existingCodes[0].customization_code);
    }
  }

  let nextSequence = maxSequence + 1;
  const customizationsToInsert: any[] = [];

  // =============================================
  // 1. Processar customizações de OPCIONAIS
  // =============================================
  for (const opt of optionsToProcess) {
    // Verificar se é uma customização que já estava aprovada
    const existingApproved = existingCustomizations.find(
      (c) => c.option_id === opt.option_id && c.status === "approved"
    );

    const status = existingApproved ? "approved" : "pending";
    const workflow_status = existingApproved
      ? "approved"
      : "pending_pm_review";

    // Usar código existente OU gerar novo
    const code =
      existingApproved?.customization_code ||
      generateCode(quotationNumber, nextSequence++);

    customizationsToInsert.push({
      quotation_id: quotationId,
      option_id: opt.option_id,
      memorial_item_id: null,
      item_name: `Customização de Opcional`,
      customization_code: code,
      notes: opt.customization_notes,
      status,
      workflow_status,
      quantity: null,
      file_paths: existingApproved?.file_paths || [],
      // Preservar campos técnicos se aprovado
      pm_final_price: existingApproved?.pm_final_price || 0,
      pm_final_delivery_impact_days:
        existingApproved?.pm_final_delivery_impact_days || 0,
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
      workflow_audit: existingApproved?.workflow_audit || [],
    });
  }

  // =============================================
  // 2. Processar customizações de MEMORIAL
  // =============================================
  for (const customization of customizations) {
    // Verificar se é uma customização que já estava aprovada
    const existingApproved = existingCustomizations.find((c) => {
      if (customization.memorial_item_id && c.memorial_item_id) {
        return (
          c.memorial_item_id === customization.memorial_item_id &&
          c.status === "approved"
        );
      }
      // Para customizações livres (sem memorial_item_id)
      return c.item_name === customization.item_name && c.status === "approved";
    });

    const status = existingApproved ? "approved" : "pending";
    const workflow_status = existingApproved
      ? "approved"
      : "pending_pm_review";

    // Usar código existente OU gerar novo
    const code =
      existingApproved?.customization_code ||
      generateCode(quotationNumber, nextSequence++);

    customizationsToInsert.push({
      quotation_id: quotationId,
      memorial_item_id: customization.memorial_item_id?.startsWith("free-")
        ? null
        : customization.memorial_item_id,
      option_id: customization.option_id || null,
      item_name: customization.item_name,
      customization_code: code,
      notes: customization.notes,
      quantity: customization.quantity || null,
      file_paths: customization.image_url
        ? [customization.image_url]
        : existingApproved?.file_paths || [],
      status,
      workflow_status,
      // Preservar campos técnicos se aprovado
      pm_final_price: existingApproved?.pm_final_price || 0,
      pm_final_delivery_impact_days:
        existingApproved?.pm_final_delivery_impact_days || 0,
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
      workflow_audit: existingApproved?.workflow_audit || [],
    });
  }

  // =============================================
  // 3. Inserir todas as customizações
  // =============================================
  const { data: insertedCustomizations, error } = await supabase
    .from("quotation_customizations")
    .insert(customizationsToInsert)
    .select(
      "id, item_name, memorial_item_id, option_id, quantity, notes, customization_code, status, workflow_status"
    );

  if (error) {
    console.error("Erro ao inserir customizações:", error);
    throw error;
  }

  // =============================================
  // 4. Calcular estatísticas para retorno
  // =============================================

  // Verificar se há novas customizações pendentes (que não eram aprovadas antes)
  const hasNewPendingCustomizations = (insertedCustomizations || []).some(
    (c) => {
      const wasApproved = existingCustomizations.find((ec) => {
        if (c.option_id && ec.option_id) {
          return ec.option_id === c.option_id && ec.status === "approved";
        }
        if (c.memorial_item_id && ec.memorial_item_id) {
          return (
            ec.memorial_item_id === c.memorial_item_id &&
            ec.status === "approved"
          );
        }
        return ec.item_name === c.item_name && ec.status === "approved";
      });
      return !wasApproved;
    }
  );

  // Verificar customizações aprovadas que foram removidas
  const newCustomizationKeys = customizationsToInsert.map(
    (c) =>
      `${c.memorial_item_id || "null"}-${c.option_id || "null"}-${c.item_name}`
  );

  const removedApprovedCount = approvedCustomizations.filter(
    (c) =>
      !newCustomizationKeys.includes(
        `${c.memorial_item_id || "null"}-${c.option_id || "null"}-${c.item_name}`
      )
  ).length;

  // Determinar novo status da cotação
  let newQuotationStatus: string | undefined;
  if (removedApprovedCount > 0) {
    newQuotationStatus = "draft";
  } else if (hasNewPendingCustomizations) {
    newQuotationStatus = "pending_technical_approval";
  }

  return {
    success: true,
    insertedCount: insertedCustomizations?.length || 0,
    hasNewPendingCustomizations,
    removedApprovedCount,
    newQuotationStatus,
    createdCustomizations: (insertedCustomizations || []).map((c) => ({
      id: c.id,
      item_name: c.item_name,
      customization_code: c.customization_code,
      status: c.status,
      workflow_status: c.workflow_status,
    })),
  };
}

/**
 * Hook React Query para salvar customizações de cotações
 * 
 * @description
 * Wrapper de saveQuotationCustomizations com benefícios do React Query:
 * - Invalidação automática de cache após sucesso
 * - Estados de loading/error/success
 * - Integração com React Query DevTools
 * 
 * **Queries invalidadas:**
 * - `quotations` - Lista de cotações
 * - `quotation-customizations` - Customizações específicas
 * 
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @example
 * ```typescript
 * function CustomizationEditor({ quotationId, quotationNumber }) {
 *   const { mutateAsync: saveCustomizations, isPending } = useQuotationCustomizations();
 *   const [customizations, setCustomizations] = useState([]);
 * 
 *   const handleSave = async () => {
 *     try {
 *       const result = await saveCustomizations({
 *         quotationId,
 *         quotationNumber,
 *         customizations,
 *         isEditMode: true
 *       });
 * 
 *       if (result.hasNewPendingCustomizations) {
 *         toast.info('Customizações enviadas para aprovação');
 *       }
 *     } catch (error) {
 *       toast.error('Erro ao salvar customizações');
 *     }
 *   };
 * 
 *   return (
 *     <Button onClick={handleSave} disabled={isPending}>
 *       {isPending ? 'Salvando...' : 'Salvar'}
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @see {@link saveQuotationCustomizations} - Função de salvamento
 */
export function useQuotationCustomizations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveCustomizationsInput): Promise<SaveCustomizationsResult> => {
      return saveQuotationCustomizations(input);
    },

    onSuccess: () => {
      // Invalidar cache de customizações e cotações
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation-customizations"] });
    },

    onError: (error) => {
      console.error("Erro ao salvar customizações:", error);
    },
  });
}
