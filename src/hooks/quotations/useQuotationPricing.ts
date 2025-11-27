/**
 * Hook para cálculos de pricing de cotações
 * Centraliza toda a lógica de preços, descontos e prazos
 */

import { useMemo } from 'react';

interface PricingInput {
  basePrice: number;
  baseDeliveryDays: number;
  selectedOptions: Array<{
    unit_price: number;
    quantity: number;
    delivery_days_impact?: number;
  }>;
  baseDiscountPercentage?: number;
  optionsDiscountPercentage?: number;
}

interface PricingResult {
  totalOptionsPrice: number;
  baseDiscountAmount: number;
  finalBasePrice: number;
  optionsDiscountAmount: number;
  finalOptionsPrice: number;
  finalPrice: number;
  totalDeliveryDays: number;
  maxDeliveryImpact: number;
  error?: string;
}

const MAX_DISCOUNT_PERCENTAGE = 30;

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

// Hook wrapper para uso com React (memoizado para evitar recálculos desnecessários)
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
