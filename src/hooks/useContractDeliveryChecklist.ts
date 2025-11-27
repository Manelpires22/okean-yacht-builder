import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryChecklistItem {
  id: string;
  contract_id: string;
  item_type: "option" | "customization" | "ato_item" | "memorial_item";
  item_id: string;
  item_name: string;
  item_code: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  photo_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface DeliveryProgress {
  total: number;
  verified: number;
  percentage: number;
}

/**
 * Hook para buscar checklist de entrega de um contrato
 * Se o checklist estiver vazio, popula automaticamente com os itens do contrato
 */
export function useContractDeliveryChecklist(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract-delivery-checklist", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      // Buscar checklist existente
      const { data: checklist, error: checklistError } = await supabase
        .from("contract_delivery_checklist")
        .select("*")
        .eq("contract_id", contractId)
        .order("item_type")
        .order("item_name");

      if (checklistError) throw checklistError;

      // Se checklist vazio, popular automaticamente
      if (!checklist || checklist.length === 0) {
        await populateChecklist(contractId);
        
        // Buscar novamente após popular
        const { data: newChecklist, error: newError } = await supabase
          .from("contract_delivery_checklist")
          .select("*")
          .eq("contract_id", contractId)
          .order("item_type")
          .order("item_name");

        if (newError) throw newError;
        return newChecklist as DeliveryChecklistItem[];
      }

      return checklist as DeliveryChecklistItem[];
    },
    enabled: !!contractId,
  });
}

/**
 * Função auxiliar para popular checklist com itens do contrato
 */
async function populateChecklist(contractId: string) {
  // Buscar dados do contrato
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`
      id,
      base_snapshot,
      yacht_model_id
    `)
    .eq("id", contractId)
    .single();

  if (contractError) throw contractError;

  const items: any[] = [];
  const baseSnapshot = contract.base_snapshot as any;

  // 1. Adicionar opcionais do snapshot
  if (baseSnapshot?.selected_options) {
    baseSnapshot.selected_options.forEach((opt: any) => {
      items.push({
        contract_id: contractId,
        item_type: "option",
        item_id: opt.option_id || opt.option?.id,
        item_name: opt.option?.name || "Opcional",
        item_code: opt.option?.code,
      });
    });
  }

  // 2. Buscar customizações incluídas no contrato
  const { data: customizations, error: customError } = await supabase
    .from("quotation_customizations")
    .select("id, item_name, customization_code")
    .eq("included_in_contract", true)
    .in("quotation_id", [
      (await supabase.from("contracts").select("quotation_id").eq("id", contractId).single()).data?.quotation_id
    ]);

  if (!customError && customizations) {
    customizations.forEach((cust: any) => {
      items.push({
        contract_id: contractId,
        item_type: "customization",
        item_id: cust.id,
        item_name: cust.item_name,
        item_code: cust.customization_code,
      });
    });
  }

  // 3. Buscar ATOs aprovadas
  const { data: atos, error: atosError } = await supabase
    .from("additional_to_orders")
    .select("id, title, ato_number")
    .eq("contract_id", contractId)
    .eq("status", "approved");

  if (!atosError && atos) {
    atos.forEach((ato: any) => {
      items.push({
        contract_id: contractId,
        item_type: "ato_item",
        item_id: ato.id,
        item_name: ato.title,
        item_code: ato.ato_number,
      });
    });
  }

  // Inserir todos os itens no checklist
  if (items.length > 0) {
    const { error: insertError } = await supabase
      .from("contract_delivery_checklist")
      .insert(items);

    if (insertError) {
      console.error("Error populating checklist:", insertError);
    }
  }
}

/**
 * Calcular progresso de verificação
 */
export function calculateProgress(items: DeliveryChecklistItem[]): DeliveryProgress {
  const total = items.length;
  const verified = items.filter((item) => item.is_verified).length;
  const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;

  return { total, verified, percentage };
}
