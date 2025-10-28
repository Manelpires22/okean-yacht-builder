import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Gera um código único para uma customização
 * Formato: <QUOTATION_NUMBER>-CUS-<SEQUENCE>
 * Exemplo: QT-2025-277-V1-CUS-001
 */
export async function generateCustomizationCode(
  quotationNumber: string,
  supabase: SupabaseClient
): Promise<string> {
  // Buscar última sequência para esta cotação
  const { data } = await supabase
    .from('quotation_customizations')
    .select('customization_code')
    .like('customization_code', `${quotationNumber}-CUS-%`)
    .order('created_at', { ascending: false })
    .limit(1);

  let nextSequence = 1;
  
  if (data && data.length > 0 && data[0].customization_code) {
    const match = data[0].customization_code.match(/-CUS-(\d+)$/);
    if (match) {
      nextSequence = parseInt(match[1]) + 1;
    }
  }

  return `${quotationNumber}-CUS-${String(nextSequence).padStart(3, '0')}`;
}
