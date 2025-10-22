import { AppRole } from "@/hooks/useUserRole";

export interface DiscountLimits {
  noApprovalRequired: number;
  managerApprovalRequired: number;
  adminApprovalRequired: number;
}

// Limites de desconto para PREÇO BASE do iate
export const BASE_DISCOUNT_LIMITS: DiscountLimits = {
  noApprovalRequired: 10,        // até 10% não precisa aprovação
  managerApprovalRequired: 15,   // 10-15% precisa aprovação do gerente
  adminApprovalRequired: Infinity // > 15% precisa aprovação do admin
};

// Limites de desconto para OPCIONAIS
export const OPTIONS_DISCOUNT_LIMITS: DiscountLimits = {
  noApprovalRequired: 8,         // até 8% não precisa aprovação
  managerApprovalRequired: 12,   // 8-12% precisa aprovação do gerente
  adminApprovalRequired: Infinity // > 12% precisa aprovação do admin
};

export function getRequiredApproverRole(
  baseDiscountPercentage: number,
  optionsDiscountPercentage: number
): AppRole | null {
  const maxDiscount = Math.max(baseDiscountPercentage, optionsDiscountPercentage);
  
  if (maxDiscount <= Math.min(BASE_DISCOUNT_LIMITS.noApprovalRequired, OPTIONS_DISCOUNT_LIMITS.noApprovalRequired)) {
    return null; // Não precisa aprovação
  }
  
  if (maxDiscount <= Math.max(BASE_DISCOUNT_LIMITS.managerApprovalRequired, OPTIONS_DISCOUNT_LIMITS.managerApprovalRequired)) {
    return 'gerente_comercial';
  }
  
  return 'administrador';
}

export function needsApproval(
  baseDiscountPercentage: number,
  optionsDiscountPercentage: number
): boolean {
  return baseDiscountPercentage > BASE_DISCOUNT_LIMITS.noApprovalRequired ||
         optionsDiscountPercentage > OPTIONS_DISCOUNT_LIMITS.noApprovalRequired;
}

export function canApproveDiscount(
  baseDiscountPercentage: number,
  optionsDiscountPercentage: number,
  userRoles: AppRole[]
): boolean {
  if (userRoles.includes('administrador')) {
    return true; // Admin pode aprovar qualquer desconto
  }
  
  if (userRoles.includes('gerente_comercial')) {
    return baseDiscountPercentage <= BASE_DISCOUNT_LIMITS.managerApprovalRequired &&
           optionsDiscountPercentage <= OPTIONS_DISCOUNT_LIMITS.managerApprovalRequired;
  }
  
  return false;
}

export function getDiscountApprovalMessage(
  baseDiscountPercentage: number,
  optionsDiscountPercentage: number
): string {
  const maxDiscount = Math.max(baseDiscountPercentage, optionsDiscountPercentage);
  
  if (!needsApproval(baseDiscountPercentage, optionsDiscountPercentage)) {
    return "Desconto aprovado automaticamente";
  }
  
  if (maxDiscount <= Math.max(BASE_DISCOUNT_LIMITS.managerApprovalRequired, OPTIONS_DISCOUNT_LIMITS.managerApprovalRequired)) {
    return "Este desconto requer aprovação do Gerente Comercial";
  }
  
  return "Este desconto requer aprovação do Administrador";
}
