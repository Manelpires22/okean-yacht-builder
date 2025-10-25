import { AppRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

export interface DiscountLimits {
  noApprovalRequired: number;
  directorApprovalRequired: number;
  adminApprovalRequired: number;
}

interface DiscountLimitsConfig {
  BASE_DISCOUNT_LIMITS: DiscountLimits;
  OPTIONS_DISCOUNT_LIMITS: DiscountLimits;
}

let cachedLimits: DiscountLimitsConfig | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca os limites de desconto configurados no banco de dados
 * Implementa cache para evitar múltiplas queries
 */
export async function getDiscountLimitsFromDB(): Promise<DiscountLimitsConfig> {
  const now = Date.now();
  
  // Retornar cache se ainda válido
  if (cachedLimits && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedLimits;
  }

  try {
    const { data, error } = await supabase
      .from('discount_limits_config' as any)
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar limites de desconto:', error);
      // Fallback para valores padrão se houver erro
      return getFallbackLimits();
    }

    const baseConfig = data?.find((d: any) => d.limit_type === 'base');
    const optionsConfig = data?.find((d: any) => d.limit_type === 'options');

    if (!baseConfig || !optionsConfig) {
      console.warn('Limites de desconto não encontrados no banco, usando valores padrão');
      return getFallbackLimits();
    }

    const limits: DiscountLimitsConfig = {
      BASE_DISCOUNT_LIMITS: {
        noApprovalRequired: (baseConfig as any).no_approval_max || 10,
        directorApprovalRequired: (baseConfig as any).director_approval_max || 15,
        adminApprovalRequired: (baseConfig as any).admin_approval_required_above || 15
      },
      OPTIONS_DISCOUNT_LIMITS: {
        noApprovalRequired: (optionsConfig as any).no_approval_max || 8,
        directorApprovalRequired: (optionsConfig as any).director_approval_max || 12,
        adminApprovalRequired: (optionsConfig as any).admin_approval_required_above || 12
      }
    };

    // Atualizar cache
    cachedLimits = limits;
    lastFetchTime = now;

    return limits;
  } catch (error) {
    console.error('Erro ao processar limites de desconto:', error);
    return getFallbackLimits();
  }
}

/**
 * Valores padrão de fallback caso haja erro ao buscar do banco
 */
function getFallbackLimits(): DiscountLimitsConfig {
  return {
    BASE_DISCOUNT_LIMITS: {
      noApprovalRequired: 10,
      directorApprovalRequired: 15,
      adminApprovalRequired: 15
    },
    OPTIONS_DISCOUNT_LIMITS: {
      noApprovalRequired: 8,
      directorApprovalRequired: 12,
      adminApprovalRequired: 12
    }
  };
}

/**
 * Invalida o cache forçando nova busca do banco
 * Útil quando os limites são atualizados
 */
export function invalidateDiscountLimitsCache(): void {
  cachedLimits = null;
  lastFetchTime = 0;
}

/**
 * Determina qual role é necessário para aprovar os descontos dados
 * @returns null se não precisa aprovação, ou o role necessário
 */
export async function getRequiredApproverRole(
  baseDiscountPercentage: number,
  optionsDiscountPercentage: number
): Promise<AppRole | null> {
  const limits = await getDiscountLimitsFromDB();
  const maxDiscount = Math.max(baseDiscountPercentage, optionsDiscountPercentage);
  
  // Verificar se não precisa aprovação
  const minNoApproval = Math.min(
    limits.BASE_DISCOUNT_LIMITS.noApprovalRequired,
    limits.OPTIONS_DISCOUNT_LIMITS.noApprovalRequired
  );
  
  if (maxDiscount <= minNoApproval) {
    return null; // Não precisa aprovação
  }
  
  // Verificar se desconto base excede limite do diretor
  if (baseDiscountPercentage > limits.BASE_DISCOUNT_LIMITS.directorApprovalRequired) {
    return 'administrador';
  }
  
  // Verificar se desconto de opcionais excede limite do diretor
  if (optionsDiscountPercentage > limits.OPTIONS_DISCOUNT_LIMITS.directorApprovalRequired) {
    return 'administrador';
  }
  
  // Se passou dos limites sem aprovação mas não passou do diretor
  return 'diretor_comercial';
}

/**
 * Verifica se os descontos dados necessitam de aprovação
 */
export async function needsApproval(
  baseDiscountPercentage: number,
  optionsDiscountPercentage: number
): Promise<boolean> {
  const limits = await getDiscountLimitsFromDB();
  
  return baseDiscountPercentage > limits.BASE_DISCOUNT_LIMITS.noApprovalRequired ||
         optionsDiscountPercentage > limits.OPTIONS_DISCOUNT_LIMITS.noApprovalRequired;
}

/**
 * Verifica se o usuário com os roles dados pode aprovar os descontos
 */
export async function canApproveDiscount(
  baseDiscountPercentage: number,
  optionsDiscountPercentage: number,
  userRoles: AppRole[]
): Promise<boolean> {
  // Admin pode aprovar qualquer desconto
  if (userRoles.includes('administrador')) {
    return true;
  }
  
  const limits = await getDiscountLimitsFromDB();
  
  // Diretor comercial pode aprovar até os limites configurados
  if (userRoles.includes('diretor_comercial')) {
    return baseDiscountPercentage <= limits.BASE_DISCOUNT_LIMITS.directorApprovalRequired &&
           optionsDiscountPercentage <= limits.OPTIONS_DISCOUNT_LIMITS.directorApprovalRequired;
  }
  
  // Gerente comercial (legacy) também pode aprovar até os limites do diretor
  if (userRoles.includes('gerente_comercial')) {
    return baseDiscountPercentage <= limits.BASE_DISCOUNT_LIMITS.directorApprovalRequired &&
           optionsDiscountPercentage <= limits.OPTIONS_DISCOUNT_LIMITS.directorApprovalRequired;
  }
  
  return false;
}

/**
 * Retorna mensagem explicativa sobre a aprovação necessária
 */
export async function getDiscountApprovalMessage(
  baseDiscountPercentage: number,
  optionsDiscountPercentage: number
): Promise<string> {
  const limits = await getDiscountLimitsFromDB();
  const maxDiscount = Math.max(baseDiscountPercentage, optionsDiscountPercentage);
  
  const needsApp = await needsApproval(baseDiscountPercentage, optionsDiscountPercentage);
  
  if (!needsApp) {
    return "Desconto aprovado automaticamente";
  }
  
  // Verificar se algum desconto excede o limite do diretor
  if (baseDiscountPercentage > limits.BASE_DISCOUNT_LIMITS.directorApprovalRequired ||
      optionsDiscountPercentage > limits.OPTIONS_DISCOUNT_LIMITS.directorApprovalRequired) {
    return "Este desconto requer aprovação do Administrador";
  }
  
  return "Este desconto requer aprovação do Diretor Comercial";
}

/**
 * Versão síncrona que usa o cache (útil para componentes)
 * Retorna os limites do cache ou valores padrão
 */
export function getDiscountLimitsSync(): DiscountLimitsConfig {
  if (cachedLimits) {
    return cachedLimits;
  }
  
  // Se não houver cache, retornar valores padrão
  // e disparar fetch assíncrono para popular o cache
  getDiscountLimitsFromDB();
  
  return getFallbackLimits();
}
