/**
 * Sistema de Precificação Dinâmica (Custo → Preço de Venda)
 * 
 * Fórmula: Preço de Venda = Custo / (1 - MDC - Impostos - Garantia - Comissão)
 * 
 * Onde:
 * - MDC: Margem de Contribuição alvo (30%)
 * - Impostos: sales_tax_domestic (19.89%) ou sales_tax_export (0%)
 * - Garantia: warranty_domestic (3%) ou warranty_export (5%)
 * - Comissão: % do vendedor selecionado
 */

export interface PricingParams {
  cost: number;
  mdcPercent: number;          // 30%
  salesTaxPercent: number;     // 19.89% ou 0%
  warrantyPercent: number;     // 3% ou 5%
  commissionPercent: number;   // % do vendedor
}

export interface PricingRules {
  mdcPercent: number;
  salesTaxDomestic: number;
  salesTaxExport: number;
  warrantyDomestic: number;
  warrantyExport: number;
}

export type SaleType = 'national' | 'export';

/**
 * Calcula o preço de venda a partir do custo usando markup reverso
 * 
 * Fórmula: Preço = Custo / (1 - MDC - Imposto - Garantia - Comissão)
 * 
 * Exemplo Nacional:
 * - Custo: R$ 10.000
 * - MDC: 30% + Imposto: 19.89% + Garantia: 3% + Comissão: 3% = 55.89%
 * - Preço = 10.000 / (1 - 0.5589) = 10.000 / 0.4411 = R$ 22.669,68
 * 
 * Exemplo Exportação:
 * - Custo: R$ 10.000
 * - MDC: 30% + Imposto: 0% + Garantia: 5% + Comissão: 3% = 38%
 * - Preço = 10.000 / (1 - 0.38) = 10.000 / 0.62 = R$ 16.129,03
 */
export function calculateSellingPrice(params: PricingParams): number {
  const { cost, mdcPercent, salesTaxPercent, warrantyPercent, commissionPercent } = params;
  
  if (!cost || cost <= 0) return 0;
  
  const totalDeductionsPercent = mdcPercent + salesTaxPercent + warrantyPercent + commissionPercent;
  const totalDeductions = totalDeductionsPercent / 100;
  
  // Proteção contra divisão por zero ou deduções >= 100%
  if (totalDeductions >= 1) {
    console.warn('Deduções excedem ou igualam 100%, retornando custo como preço');
    return cost;
  }
  
  const sellingPrice = cost / (1 - totalDeductions);
  
  return Math.round(sellingPrice * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Calcula o custo a partir do preço de venda (inverso)
 * Útil para validação ou cenários onde já temos o preço
 */
export function calculateCostFromPrice(price: number, params: Omit<PricingParams, 'cost'>): number {
  const { mdcPercent, salesTaxPercent, warrantyPercent, commissionPercent } = params;
  
  if (!price || price <= 0) return 0;
  
  const totalDeductionsPercent = mdcPercent + salesTaxPercent + warrantyPercent + commissionPercent;
  const totalDeductions = totalDeductionsPercent / 100;
  
  if (totalDeductions >= 1) {
    console.warn('Deduções excedem ou igualam 100%, retornando preço como custo');
    return price;
  }
  
  const cost = price * (1 - totalDeductions);
  
  return Math.round(cost * 100) / 100;
}

/**
 * Retorna os parâmetros de pricing baseado no tipo de venda
 */
export function getPricingParamsForSaleType(
  saleType: SaleType,
  commissionPercent: number,
  rules: PricingRules
): Omit<PricingParams, 'cost'> {
  return {
    mdcPercent: rules.mdcPercent,
    salesTaxPercent: saleType === 'national' ? rules.salesTaxDomestic : rules.salesTaxExport,
    warrantyPercent: saleType === 'national' ? rules.warrantyDomestic : rules.warrantyExport,
    commissionPercent: commissionPercent,
  };
}

/**
 * Calcula múltiplos preços de venda em lote (para listas de opcionais/upgrades)
 */
export function calculateBatchSellingPrices(
  costs: number[],
  saleType: SaleType,
  commissionPercent: number,
  rules: PricingRules
): number[] {
  const params = getPricingParamsForSaleType(saleType, commissionPercent, rules);
  
  return costs.map(cost => calculateSellingPrice({ ...params, cost }));
}

/**
 * Formata a breakdown de markup para exibição
 */
export function getMarkupBreakdown(
  cost: number,
  saleType: SaleType,
  commissionPercent: number,
  rules: PricingRules
): {
  cost: number;
  sellingPrice: number;
  mdcAmount: number;
  salesTaxAmount: number;
  warrantyAmount: number;
  commissionAmount: number;
  totalMarkupPercent: number;
} {
  const params = getPricingParamsForSaleType(saleType, commissionPercent, rules);
  const sellingPrice = calculateSellingPrice({ ...params, cost });
  
  const mdcAmount = sellingPrice * (params.mdcPercent / 100);
  const salesTaxAmount = sellingPrice * (params.salesTaxPercent / 100);
  const warrantyAmount = sellingPrice * (params.warrantyPercent / 100);
  const commissionAmount = sellingPrice * (params.commissionPercent / 100);
  
  const totalMarkupPercent = cost > 0 ? ((sellingPrice - cost) / cost) * 100 : 0;
  
  return {
    cost,
    sellingPrice,
    mdcAmount,
    salesTaxAmount,
    warrantyAmount,
    commissionAmount,
    totalMarkupPercent,
  };
}

/**
 * Valores padrão para regras de pricing (fallback)
 */
export const DEFAULT_PRICING_RULES: PricingRules = {
  mdcPercent: 30,
  salesTaxDomestic: 19.89,
  salesTaxExport: 0,
  warrantyDomestic: 3,
  warrantyExport: 5,
};

/**
 * Comissão padrão quando não há vendedor selecionado
 */
export const DEFAULT_COMMISSION_PERCENT = 3;
