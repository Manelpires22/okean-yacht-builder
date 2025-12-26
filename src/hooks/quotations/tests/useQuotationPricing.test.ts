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
      expect(result.totalUpgradesPrice).toBe(0);
      expect(result.finalBasePrice).toBe(100000);
      expect(result.finalOptionsPrice).toBe(13000);
      expect(result.finalUpgradesPrice).toBe(0);
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

  describe('Cálculo de upgrades', () => {
    it('deve incluir upgrades no preço final com desconto de opcionais', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 10000, quantity: 1, delivery_days_impact: 0 },
        ],
        selectedUpgrades: [
          { price: 5000, delivery_days_impact: 5 },
          { price: 3000, delivery_days_impact: 0 },
        ],
        baseDiscountPercentage: 0,
        optionsDiscountPercentage: 10, // 10% de desconto em opcionais E upgrades
      });

      // Opcionais: 10000 - 10% = 9000
      // Upgrades: 8000 - 10% = 7200
      expect(result.totalOptionsPrice).toBe(10000);
      expect(result.totalUpgradesPrice).toBe(8000);
      expect(result.optionsDiscountAmount).toBe(1000);
      expect(result.upgradesDiscountAmount).toBe(800);
      expect(result.finalOptionsPrice).toBe(9000);
      expect(result.finalUpgradesPrice).toBe(7200);
      expect(result.finalPrice).toBe(116200); // 100000 + 9000 + 7200
    });

    it('deve considerar impacto de prazo dos upgrades', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 1000, quantity: 1, delivery_days_impact: 5 },
        ],
        selectedUpgrades: [
          { price: 5000, delivery_days_impact: 20 }, // Maior impacto
        ],
      });

      expect(result.maxDeliveryImpact).toBe(20);
      expect(result.totalDeliveryDays).toBe(200); // 180 + 20
    });

    it('deve calcular corretamente sem upgrades', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [],
        selectedUpgrades: [],
      });

      expect(result.totalUpgradesPrice).toBe(0);
      expect(result.upgradesDiscountAmount).toBe(0);
      expect(result.finalUpgradesPrice).toBe(0);
      expect(result.finalPrice).toBe(100000);
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
    it('deve usar o maior impacto de prazo entre opcionais e upgrades', () => {
      const result = calculateQuotationPricing({
        basePrice: 100000,
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 1000, quantity: 1, delivery_days_impact: 5 },
          { unit_price: 2000, quantity: 1, delivery_days_impact: 15 },
        ],
        selectedUpgrades: [
          { price: 3000, delivery_days_impact: 10 },
          { price: 4000, delivery_days_impact: 25 }, // Maior impacto geral
        ],
      });

      expect(result.maxDeliveryImpact).toBe(25);
      expect(result.totalDeliveryDays).toBe(205); // 180 + 25
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

    it('deve calcular cenário completo com base, opcionais e upgrades', () => {
      const result = calculateQuotationPricing({
        basePrice: 10900000, // R$ 10.9M
        baseDeliveryDays: 180,
        selectedOptions: [
          { unit_price: 470457.10, quantity: 1, delivery_days_impact: 10 },
        ],
        selectedUpgrades: [
          { price: 582552.08, delivery_days_impact: 15 },
        ],
        baseDiscountPercentage: 8,
        optionsDiscountPercentage: 5,
      });

      // Base: 10.9M - 8% = 10.028M
      expect(result.finalBasePrice).toBeCloseTo(10028000, 0);
      
      // Opcionais: 470457.10 - 5% = 446934.25
      expect(result.finalOptionsPrice).toBeCloseTo(446934.25, 0);
      
      // Upgrades: 582552.08 - 5% = 553424.48
      expect(result.finalUpgradesPrice).toBeCloseTo(553424.48, 0);
      
      // Total: 10.028M + 446934.25 + 553424.48 = 11.028.358,73
      expect(result.finalPrice).toBeCloseTo(11028358.73, 0);
      
      // Prazo: 180 + 15 (maior impacto) = 195
      expect(result.totalDeliveryDays).toBe(195);
    });
  });
});
