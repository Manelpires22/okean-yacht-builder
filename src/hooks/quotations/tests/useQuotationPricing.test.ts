import { describe, it, expect } from 'vitest';
import { calculateQuotationPricing } from '../useQuotationPricing';

describe('useQuotationPricing', () => {
  describe('Cálculo de preços básico', () => {
    it('deve calcular preço total sem descontos', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 5000, quantity: 2, delivery_days_impact: 10 },
          { unit_price: 3000, quantity: 1, delivery_days_impact: 5 },
        ],
        baseDiscountPercentage: 0,
        optionsDiscountPercentage: 0,
      });

      expect(result.totalOptionsPrice).toBe(13000); // (5000*2) + (3000*1)
      expect(result.finalBasePrice).toBe(100000);
      expect(result.finalOptionsPrice).toBe(13000);
      expect(result.finalPrice).toBe(113000);
      expect(result.totalDeliveryDays).toBe(190); // 180 + 10 (maior impacto)
      expect(result.error).toBeUndefined();
    });

    it('deve calcular preço com desconto base de 10%', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [],
        baseDiscountPercentage: 10,
        optionsDiscountPercentage: 0,
      });

      expect(result.baseDiscountAmount).toBe(10000);
      expect(result.finalBasePrice).toBe(90000);
      expect(result.finalPrice).toBe(90000);
    });

    it('deve calcular preço com desconto de opcionais de 15%', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 10000, quantity: 1, delivery_days_impact: 0 },
        ],
        baseDiscountPercentage: 0,
        optionsDiscountPercentage: 15,
      });

      expect(result.totalOptionsPrice).toBe(10000);
      expect(result.optionsDiscountAmount).toBe(1500);
      expect(result.finalOptionsPrice).toBe(8500);
      expect(result.finalPrice).toBe(108500); // 100000 + 8500
    });
  });

  describe('Validação de descontos', () => {
    it('deve retornar erro se desconto base > 30%', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [],
        baseDiscountPercentage: 35,
        optionsDiscountPercentage: 0,
      });

      expect(result.error).toBe('Desconto base não pode exceder 30%');
      expect(result.finalPrice).toBe(100000);
    });

    it('deve retornar erro se desconto de opcionais > 30%', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [{ unit_price: 5000, quantity: 1 }],
        baseDiscountPercentage: 0,
        optionsDiscountPercentage: 40,
      });

      expect(result.error).toBe('Desconto de opcionais não pode exceder 30%');
    });

    it('deve aceitar desconto exatamente de 30%', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [],
        baseDiscountPercentage: 30,
        optionsDiscountPercentage: 0,
      });

      expect(result.error).toBeUndefined();
      expect(result.baseDiscountAmount).toBe(30000);
      expect(result.finalBasePrice).toBe(70000);
    });
  });

  describe('Cálculo de prazos', () => {
    it('deve usar o maior impacto de prazo entre opcionais', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 1000, quantity: 1, delivery_days_impact: 5 },
          { unit_price: 2000, quantity: 1, delivery_days_impact: 15 },
          { unit_price: 3000, quantity: 1, delivery_days_impact: 10 },
        ],
      });

      expect(result.maxDeliveryImpact).toBe(15);
      expect(result.totalDeliveryDays).toBe(195); // 180 + 15
    });

    it('deve lidar com opcionais sem impacto de prazo', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 1000, quantity: 1 },
          { unit_price: 2000, quantity: 1, delivery_days_impact: 0 },
        ],
      });

      expect(result.maxDeliveryImpact).toBe(0);
      expect(result.totalDeliveryDays).toBe(180);
    });
  });

  describe('Casos extremos', () => {
    it('deve lidar com valores zerados', () => {
      const result = calculateQuotationPricing({
        basePrice: 0,
        baseDeliveryDays: 0,
        selectedOptions: [],
      });

      expect(result.finalPrice).toBe(0);
      expect(result.totalDeliveryDays).toBe(0);
    });

    it('deve lidar com múltiplas quantidades', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 1000, quantity: 5 },
          { unit_price: 2000, quantity: 3 },
        ],
      });

      expect(result.totalOptionsPrice).toBe(11000); // (1000*5) + (2000*3)
    });
  });
});
