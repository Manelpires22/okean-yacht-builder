/**
 * Funções para criar/atualizar simulações automaticamente a partir de cotações
 */

import { supabase } from "@/integrations/supabase/client";
import type { Currency, ExportCurrency } from "@/hooks/useSimulatorState";

interface CreateSimulationParams {
  quotationId: string;
  quotationNumber: string;
  yachtModelId: string;
  yachtModelName: string;
  yachtModelCode: string;
  basePrice: number;
  finalPrice: number;
  optionsTotal: number;
  upgradesTotal: number;
  customizationsTotal: number;
  commissionData?: {
    id: string;
    name: string;
    percent: number;
    type: string;
  };
  clientData?: {
    id: string;
    name: string;
  };
  tradeInData?: {
    hasTradeIn: boolean;
    tradeInBrand: string;
    tradeInModel: string;
    tradeInYear: number | null;
    tradeInEntryValue: number;
    tradeInRealValue: number;
  };
  createdBy: string;
}

interface SimulationCalculations {
  fatLiquido: number;
  custoVenda: number;
  margemBruta: number;
  margemPercent: number;
  adjustedCommissionPercent: number;
  commissionAdjustmentFactor: number;
  tradeInDepreciation: number;
  tradeInOperationCost: number;
  tradeInCommission: number;
  tradeInTotalImpact: number;
}

/**
 * Busca custos do modelo e regras de negócio necessárias para cálculo MDC
 */
async function fetchSimulatorData(yachtModelId: string) {
  // Buscar custos do modelo
  const { data: modelCosts } = await supabase
    .from('simulator_model_costs')
    .select('*')
    .eq('yacht_model_id', yachtModelId)
    .maybeSingle();

  // Buscar regras de negócio
  const { data: rules } = await supabase
    .from('simulator_business_rules')
    .select('*');

  const rulesMap: Record<string, number> = {};
  rules?.forEach((r: any) => {
    rulesMap[r.rule_key] = r.rule_value;
  });

  // Buscar taxas de câmbio
  const { data: exchangeRates } = await supabase
    .from('simulator_exchange_rates')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(2);

  let eurRate = 6.0;
  let usdRate = 5.0;
  exchangeRates?.forEach((rate: any) => {
    if (rate.currency === 'EUR') eurRate = rate.rate;
    if (rate.currency === 'USD') usdRate = rate.rate;
  });

  return {
    modelCosts,
    rulesMap,
    eurRate,
    usdRate,
  };
}

/**
 * Calcula todos os valores MDC a partir dos dados fornecidos
 */
function calculateMDC(params: {
  faturamentoBruto: number;
  customizacoesEstimadas: number;
  commissionPercent: number;
  modelCosts: any;
  rulesMap: Record<string, number>;
  eurRate: number;
  usdRate: number;
  tradeInData?: CreateSimulationParams['tradeInData'];
}): SimulationCalculations {
  const {
    faturamentoBruto,
    customizacoesEstimadas,
    commissionPercent,
    modelCosts,
    rulesMap,
    eurRate,
    usdRate,
    tradeInData,
  } = params;

  // Valores padrão
  const salesTaxPercent = rulesMap['sales_tax_domestic'] ?? 21;
  const warrantyPercent = rulesMap['warranty_domestic'] ?? 3;
  const royaltiesPercent = rulesMap['royalties_percent'] ?? 0.6;
  const transporteCost = 0; // Doméstico = 0

  // Custos do modelo
  const custoMpImport = modelCosts?.custo_mp_import ?? 0;
  const custoMpImportCurrency = modelCosts?.custo_mp_import_currency ?? 'EUR';
  const custoMpNacional = modelCosts?.custo_mp_nacional ?? 0;
  const custoMoHoras = modelCosts?.custo_mo_horas ?? 0;
  const custoMoValorHora = modelCosts?.custo_mo_valor_hora ?? 55;
  const taxImportPercent = modelCosts?.tax_import_percent ?? 0;

  // Converter MP importada para BRL
  const exchangeRate = custoMpImportCurrency === 'EUR' ? eurRate : usdRate;
  const mpImportBRL = custoMpImport * exchangeRate;
  const taxImportValue = mpImportBRL * (taxImportPercent / 100);

  // Trade-In calculations
  let tradeInDepreciation = 0;
  let tradeInOperationCost = 0;
  let tradeInCommission = 0;
  let tradeInTotalImpact = 0;
  let tradeInCommissionReduction = 0;

  const tradeInOperationCostPercent = rulesMap['trade_in_operation_cost'] ?? 3;
  const tradeInCommissionPercent = rulesMap['trade_in_commission'] ?? 5;
  const tradeInCommissionReductionPercent = rulesMap['trade_in_commission_reduction'] ?? 0.5;

  if (tradeInData?.hasTradeIn) {
    tradeInDepreciation = tradeInData.tradeInEntryValue - tradeInData.tradeInRealValue;
    tradeInOperationCost = tradeInData.tradeInRealValue * (tradeInOperationCostPercent / 100);
    tradeInCommission = tradeInData.tradeInRealValue * (tradeInCommissionPercent / 100);
    tradeInTotalImpact = tradeInDepreciation + tradeInOperationCost + tradeInCommission;
    tradeInCommissionReduction = tradeInCommissionReductionPercent;
  }

  // Ajuste de comissão base (redução por trade-in)
  const effectiveCommissionPercent = tradeInData?.hasTradeIn
    ? Math.max(0, commissionPercent - tradeInCommissionReduction)
    : commissionPercent;

  // Cálculo de Faturamento Líquido
  const salesTax = faturamentoBruto * (salesTaxPercent / 100);
  const royalties = faturamentoBruto * (royaltiesPercent / 100);
  
  // Para trade-in: comissão aplicada apenas na parte "à vista"
  let commissionBase = faturamentoBruto;
  if (tradeInData?.hasTradeIn) {
    commissionBase = faturamentoBruto - tradeInData.tradeInEntryValue;
  }
  const commission = commissionBase * (effectiveCommissionPercent / 100);

  const fatLiquido = faturamentoBruto - salesTax - transporteCost - commission - royalties;

  // Custo de Venda
  const custoMO = custoMoHoras * custoMoValorHora;
  const custoVenda = mpImportBRL + custoMpNacional + taxImportValue + custoMO + customizacoesEstimadas;

  // Garantia
  const warranty = fatLiquido * (warrantyPercent / 100);

  // Margem Bruta
  const margemBruta = fatLiquido - custoVenda - warranty - tradeInTotalImpact;

  // Margem %
  const margemPercent = fatLiquido > 0 ? (margemBruta / fatLiquido) * 100 : 0;

  // Ajuste de comissão baseado na MDC (regra: 30% é o ideal)
  const idealMDC = 30;
  const commissionAdjustmentFactor = (margemPercent - idealMDC) / idealMDC;
  const adjustedCommissionPercent = effectiveCommissionPercent * (1 + commissionAdjustmentFactor);

  return {
    fatLiquido,
    custoVenda,
    margemBruta,
    margemPercent,
    adjustedCommissionPercent,
    commissionAdjustmentFactor,
    tradeInDepreciation,
    tradeInOperationCost,
    tradeInCommission,
    tradeInTotalImpact,
  };
}

/**
 * Gera número de simulação único
 */
function generateSimulationNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SIM-${dateStr}-${randomPart}`;
}

/**
 * Cria ou atualiza uma simulação a partir dos dados de uma cotação
 */
export async function createOrUpdateSimulationFromQuotation(
  params: CreateSimulationParams,
  existingSimulationId?: string
): Promise<{ simulationId: string; calculations: SimulationCalculations }> {
  const {
    quotationId,
    quotationNumber,
    yachtModelId,
    yachtModelName,
    yachtModelCode,
    basePrice,
    finalPrice,
    optionsTotal,
    upgradesTotal,
    customizationsTotal,
    commissionData,
    clientData,
    tradeInData,
    createdBy,
  } = params;

  // Buscar dados do simulador
  const { modelCosts, rulesMap, eurRate, usdRate } = await fetchSimulatorData(yachtModelId);

  // Calcular customizações estimadas (opcionais + upgrades + customizações)
  const customizacoesEstimadas = optionsTotal + upgradesTotal + customizationsTotal;

  // Calcular MDC
  const calculations = calculateMDC({
    faturamentoBruto: finalPrice,
    customizacoesEstimadas,
    commissionPercent: commissionData?.percent ?? 0,
    modelCosts,
    rulesMap,
    eurRate,
    usdRate,
    tradeInData,
  });

  // Trade-in rules
  const tradeInOperationCostPercent = rulesMap['trade_in_operation_cost'] ?? 3;
  const tradeInCommissionPercent = rulesMap['trade_in_commission'] ?? 5;
  const tradeInCommissionReductionPercent = rulesMap['trade_in_commission_reduction'] ?? 0.5;

  // Dados da simulação
  const simulationData = {
    quotation_id: quotationId,
    client_id: clientData?.id ?? null,
    client_name: clientData?.name ?? 'Cliente não informado',
    commission_id: commissionData?.id ?? null,
    commission_name: commissionData?.name ?? '',
    commission_percent: commissionData?.percent ?? 0,
    commission_type: commissionData?.type ?? '',
    yacht_model_id: yachtModelId,
    yacht_model_code: yachtModelCode,
    yacht_model_name: yachtModelName,
    is_exporting: false,
    export_country: null,
    export_currency: null,
    faturamento_bruto: finalPrice,
    transporte_cost: 0,
    customizacoes_estimadas: customizacoesEstimadas,
    sales_tax_percent: rulesMap['sales_tax_domestic'] ?? 21,
    warranty_percent: rulesMap['warranty_domestic'] ?? 3,
    royalties_percent: rulesMap['royalties_percent'] ?? 0.6,
    tax_import_percent: modelCosts?.tax_import_percent ?? 0,
    custo_mp_import: modelCosts?.custo_mp_import ?? 0,
    custo_mp_import_currency: modelCosts?.custo_mp_import_currency ?? 'EUR',
    custo_mp_nacional: modelCosts?.custo_mp_nacional ?? 0,
    custo_mo_horas: modelCosts?.custo_mo_horas ?? 0,
    custo_mo_valor_hora: modelCosts?.custo_mo_valor_hora ?? 55,
    eur_rate: eurRate,
    usd_rate: usdRate,
    faturamento_liquido: calculations.fatLiquido,
    custo_venda: calculations.custoVenda,
    margem_bruta: calculations.margemBruta,
    margem_percent: calculations.margemPercent,
    adjusted_commission_percent: calculations.adjustedCommissionPercent,
    commission_adjustment_factor: calculations.commissionAdjustmentFactor,
    // Trade-In
    has_trade_in: tradeInData?.hasTradeIn ?? false,
    trade_in_brand: tradeInData?.hasTradeIn ? tradeInData.tradeInBrand : null,
    trade_in_model: tradeInData?.hasTradeIn ? tradeInData.tradeInModel : null,
    trade_in_year: tradeInData?.hasTradeIn ? tradeInData.tradeInYear : null,
    trade_in_entry_value: tradeInData?.hasTradeIn ? tradeInData.tradeInEntryValue : 0,
    trade_in_real_value: tradeInData?.hasTradeIn ? tradeInData.tradeInRealValue : 0,
    trade_in_depreciation: calculations.tradeInDepreciation,
    trade_in_operation_cost: calculations.tradeInOperationCost,
    trade_in_commission: calculations.tradeInCommission,
    trade_in_total_impact: calculations.tradeInTotalImpact,
    trade_in_operation_cost_percent: tradeInData?.hasTradeIn ? tradeInOperationCostPercent : null,
    trade_in_commission_percent: tradeInData?.hasTradeIn ? tradeInCommissionPercent : null,
    trade_in_commission_reduction_percent: tradeInData?.hasTradeIn ? tradeInCommissionReductionPercent : null,
    notes: `Gerada automaticamente da cotação ${quotationNumber}`,
  };

  let simulationId: string;

  if (existingSimulationId) {
    // Atualizar simulação existente
    const { error } = await supabase
      .from('simulations')
      .update({
        ...simulationData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSimulationId);

    if (error) throw error;
    simulationId = existingSimulationId;
  } else {
    // Criar nova simulação
    const { data: simulation, error } = await supabase
      .from('simulations')
      .insert({
        ...simulationData,
        simulation_number: generateSimulationNumber(),
        created_by: createdBy,
      })
      .select('id')
      .single();

    if (error) throw error;
    simulationId = simulation.id;
  }

  return { simulationId, calculations };
}
