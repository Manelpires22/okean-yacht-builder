/**
 * Hook para cálculos de pricing de cotações
 * Centraliza toda a lógica de preços, descontos e prazos
 */

import { useMemo } from 'react';

/**
 * Dados de entrada para cálculo de pricing de cotação
 * @interface PricingInput
 */
interface PricingInput {
  /** Preço base do modelo de iate em BRL */
  basePrice: number;
  /** Prazo base de entrega em dias úteis */
  baseDeliveryDays: number;
  /** Lista de opcionais selecionados com preço e quantidade */
  selectedOptions: Array<{
    /** Preço unitário do opcional em BRL */
    unit_price: number;
    /** Quantidade selecionada */
    quantity: number;
    /** Impacto no prazo de entrega em dias (opcional) */
    delivery_days_impact?: number;
  }>;
  /** Percentual de desconto no preço base (0-30%) */
  baseDiscountPercentage?: number;
  /** Percentual de desconto nos opcionais (0-30%) */
  optionsDiscountPercentage?: number;
}

/**
 * Resultado do cálculo de pricing
 * @interface PricingResult
 */
interface PricingResult {
  /** Soma dos preços de todos os opcionais (sem desconto) */
  totalOptionsPrice: number;
  /** Valor do desconto aplicado ao preço base em BRL */
  baseDiscountAmount: number;
  /** Preço base após desconto em BRL */
  finalBasePrice: number;
  /** Valor do desconto aplicado aos opcionais em BRL */
  optionsDiscountAmount: number;
  /** Preço total dos opcionais após desconto em BRL */
  finalOptionsPrice: number;
  /** Preço final total (base + opcionais com descontos) em BRL */
  finalPrice: number;
  /** Prazo total de entrega em dias (base + maior impacto) */
  totalDeliveryDays: number;
  /** Maior impacto de prazo entre os opcionais selecionados */
  maxDeliveryImpact: number;
  /** Mensagem de erro se validação falhar */
  error?: string;
}

const MAX_DISCOUNT_PERCENTAGE = 30;

/**
 * Calcula o pricing completo de uma cotação
 * 
 * @description
 * Realiza todos os cálculos de preços, descontos e prazos de entrega para uma cotação.
 * Valida limites de desconto (máximo 30%) e calcula valores finais considerando
 * opcionais selecionados.
 * 
 * @param {PricingInput} input - Dados de entrada para cálculo
 * @param {number} input.basePrice - Preço base do modelo de iate
 * @param {number} input.baseDeliveryDays - Prazo base de entrega em dias
 * @param {Array} input.selectedOptions - Opcionais selecionados com preço e quantidade
 * @param {number} [input.baseDiscountPercentage=0] - Desconto no preço base (0-30%)
 * @param {number} [input.optionsDiscountPercentage=0] - Desconto nos opcionais (0-30%)
 * 
 * @returns {PricingResult} Resultado dos cálculos
 * @returns {number} return.finalPrice - Preço final total
 * @returns {number} return.totalDeliveryDays - Prazo total de entrega
 * @returns {string} [return.error] - Mensagem de erro se validação falhar
 * 
 * @example
 * ```typescript
 * const result = calculateQuotationPricing({
 *   basePrice: 100000,
 *   baseDeliveryDays: 180,
 *   selectedOptions: [
 *     { unit_price: 5000, quantity: 2, delivery_days_impact: 10 }
 *   ],
 *   baseDiscountPercentage: 10
 * });
 * 
 * console.log(result.finalPrice); // 100000 (90000 base + 10000 opcionais)
 * console.log(result.totalDeliveryDays); // 190
 * ```
 * 
 * @see {@link useQuotationPricing} - Hook React memoizado
 */
export function calculateQuotationPricing(input: PricingInput): PricingResult {
  const {
    basePrice,
    baseDeliveryDays,
    selectedOptions,
    baseDiscountPercentage = 0,
    optionsDiscountPercentage = 0,
  } = input;

  // Validação de descontos
  if (baseDiscountPercentage > MAX_DISCOUNT_PERCENTAGE) {
    return {
      totalOptionsPrice: 0,
      baseDiscountAmount: 0,
      finalBasePrice: basePrice,
      optionsDiscountAmount: 0,
      finalOptionsPrice: 0,
      finalPrice: basePrice,
      totalDeliveryDays: baseDeliveryDays,
      maxDeliveryImpact: 0,
      error: `Desconto base não pode exceder ${MAX_DISCOUNT_PERCENTAGE}%`,
    };
  }

  if (optionsDiscountPercentage > MAX_DISCOUNT_PERCENTAGE) {
    return {
      totalOptionsPrice: 0,
      baseDiscountAmount: 0,
      finalBasePrice: basePrice,
      optionsDiscountAmount: 0,
      finalOptionsPrice: 0,
      finalPrice: basePrice,
      totalDeliveryDays: baseDeliveryDays,
      maxDeliveryImpact: 0,
      error: `Desconto de opcionais não pode exceder ${MAX_DISCOUNT_PERCENTAGE}%`,
    };
  }

  // Calcular preço total de opcionais
  const totalOptionsPrice = selectedOptions.reduce(
    (sum, opt) => sum + opt.unit_price * opt.quantity,
    0
  );

  // Calcular maior impacto de prazo
  const maxDeliveryImpact = selectedOptions.reduce(
    (max, opt) => Math.max(max, opt.delivery_days_impact || 0),
    0
  );

  // Calcular descontos
  const baseDiscountAmount = basePrice * (baseDiscountPercentage / 100);
  const finalBasePrice = basePrice - baseDiscountAmount;

  const optionsDiscountAmount = totalOptionsPrice * (optionsDiscountPercentage / 100);
  const finalOptionsPrice = totalOptionsPrice - optionsDiscountAmount;

  // Calcular totais
  const finalPrice = finalBasePrice + finalOptionsPrice;
  const totalDeliveryDays = baseDeliveryDays + maxDeliveryImpact;

  return {
    totalOptionsPrice,
    baseDiscountAmount,
    finalBasePrice,
    optionsDiscountAmount,
    finalOptionsPrice,
    finalPrice,
    totalDeliveryDays,
    maxDeliveryImpact,
  };
}

/**
 * Hook React para cálculo de pricing de cotações
 * 
 * @description
 * Wrapper memoizado de calculateQuotationPricing para uso em componentes React.
 * Evita recálculos desnecessários usando useMemo com dependências granulares.
 * 
 * @param {PricingInput} input - Dados de entrada (ver calculateQuotationPricing)
 * @returns {PricingResult} Resultado memoizado dos cálculos
 * 
 * @example
 * ```typescript
 * function ConfigurationSummary({ basePrice, selectedOptions }) {
 *   const pricing = useQuotationPricing({
 *     basePrice,
 *     baseDeliveryDays: 180,
 *     selectedOptions,
 *     baseDiscountPercentage: 10
 *   });
 *   
 *   return <div>Total: {formatCurrency(pricing.finalPrice)}</div>;
 * }
 * ```
 * 
 * @see {@link calculateQuotationPricing} - Função de cálculo pura
 */
export function useQuotationPricing(input: PricingInput): PricingResult {
  return useMemo(() => {
    return calculateQuotationPricing(input);
  }, [
    input.basePrice,
    input.baseDeliveryDays,
    input.baseDiscountPercentage,
    input.optionsDiscountPercentage,
    // Usar JSON.stringify para arrays/objetos complexos
    JSON.stringify(input.selectedOptions),
  ]);
}
