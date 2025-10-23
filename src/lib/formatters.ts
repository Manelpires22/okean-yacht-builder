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

/**
 * Converte metros para pés
 * Exemplo: 17.42 -> 57.15
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Converte pés para metros
 * Exemplo: 57.15 -> 17.42
 */
export function feetToMeters(feet: number): number {
  return feet / 3.28084;
}

/**
 * Formata conversão de metros para pés com texto
 * Exemplo: 17.42 -> "57,15 ft"
 */
export function formatFeetConversion(meters: number): string {
  const feet = metersToFeet(meters);
  return `${feet.toFixed(2).replace('.', ',')} ft`;
}
