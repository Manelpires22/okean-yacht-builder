/**
 * Formatação de números e valores monetários
 */

/**
 * Formata número com separadores de milhares para exibição
 * Exemplo: 14900000 -> "14.900.000"
 */
export function formatNumberInput(value: string | number): string {
  const numStr = value.toString().replace(/\D/g, '');
  if (!numStr) return '';
  
  return Number(numStr).toLocaleString('pt-BR');
}

/**
 * Remove formatação e retorna número puro
 * Exemplo: "14.900.000" -> "14900000"
 */
export function parseFormattedNumber(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata valor como moeda brasileira
 * Exemplo: 14900000 -> "R$ 14.900.000,00"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data para formato brasileiro
 * Exemplo: "2025-12-31" -> "31/12/2025"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}
