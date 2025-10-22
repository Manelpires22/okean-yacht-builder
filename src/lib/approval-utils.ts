import { AppRole } from "@/hooks/useUserRole";

export interface DiscountLimits {
  noApprovalRequired: number;
  managerApprovalRequired: number;
  adminApprovalRequired: number;
}

export const DISCOUNT_LIMITS: DiscountLimits = {
  noApprovalRequired: 2,        // até 2% não precisa aprovação
  managerApprovalRequired: 5,   // 2-5% precisa aprovação do gerente
  adminApprovalRequired: Infinity // > 5% precisa aprovação do admin
};

export function getRequiredApproverRole(discountPercentage: number): AppRole | null {
  if (discountPercentage <= DISCOUNT_LIMITS.noApprovalRequired) {
    return null; // Não precisa aprovação
  }
  
  if (discountPercentage <= DISCOUNT_LIMITS.managerApprovalRequired) {
    return 'gerente_comercial';
  }
  
  return 'administrador';
}

export function needsApproval(discountPercentage: number): boolean {
  return discountPercentage > DISCOUNT_LIMITS.noApprovalRequired;
}

export function canApproveDiscount(
  discountPercentage: number, 
  userRoles: AppRole[]
): boolean {
  if (userRoles.includes('administrador')) {
    return true; // Admin pode aprovar qualquer desconto
  }
  
  if (userRoles.includes('gerente_comercial')) {
    return discountPercentage <= DISCOUNT_LIMITS.managerApprovalRequired;
  }
  
  return false;
}

export function getDiscountApprovalMessage(discountPercentage: number): string {
  if (discountPercentage <= DISCOUNT_LIMITS.noApprovalRequired) {
    return "Desconto aprovado automaticamente";
  }
  
  if (discountPercentage <= DISCOUNT_LIMITS.managerApprovalRequired) {
    return "Este desconto requer aprovação do Gerente Comercial";
  }
  
  return "Este desconto requer aprovação do Administrador";
}
