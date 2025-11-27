import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para salvamento de customizações de cotações
 * Centraliza toda a lógica de:
 * - Geração de códigos sequenciais
 * - Preservação de dados aprovados em modo edição
 * - Determinação de workflow_status inicial
 */

// Interface para customização vinda do memorial
interface CustomizationInput {
  item_name: string;
  notes?: string;
  quantity?: number;
  additional_cost?: number;
  delivery_impact_days?: number;
  memorial_item_id?: string;
  option_id?: string;
  image_url?: string;
}

// Interface para opcionais que têm notas de customização
interface OptionWithCustomization {
  option_id: string;
  customization_notes?: string;
}

interface SaveCustomizationsInput {
  quotationId: string;
  quotationNumber: string;
  customizations: CustomizationInput[];
  optionsWithCustomization?: OptionWithCustomization[];
  isEditMode?: boolean;
}

interface SaveCustomizationsResult {
  success: boolean;
  insertedCount: number;
  hasNewPendingCustomizations: boolean;
  removedApprovedCount: number;
  newQuotationStatus?: string;
  createdCustomizations: Array<{
    id: string;
    item_name: string;
    customization_code: string;
    status: string;
    workflow_status: string;
  }>;
}

/**
 * Gera o próximo código de customização baseado na sequência
 */
function generateCode(quotationNumber: string, sequence: number): string {
  return `${quotationNumber}-CUS-${String(sequence).padStart(3, "0")}`;
}

/**
 * Extrai a sequência de um código de customização
 */
function extractSequence(code: string): number {
  const match = code?.match(/-CUS-(\d+)$/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Salva customizações de uma cotação (memorial + opcionais)
 * Em modo edição, preserva dados de customizações já aprovadas
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
 * Usado em componentes que precisam de invalidação automática de cache
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
