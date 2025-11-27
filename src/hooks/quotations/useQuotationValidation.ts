/**
 * Hook para validação de cotações
 * Centraliza todas as validações de dados e regras de negócio
 */

import { AppRole } from "@/hooks/useUserRole";
import { getDiscountLimitsSync } from "@/lib/approval-utils";

interface ValidationInput {
  yacht_model_id?: string;
  client_name?: string;
  client_email?: string;
  baseDiscountPercentage?: number;
  optionsDiscountPercentage?: number;
  userRoles: AppRole[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const MAX_ABSOLUTE_DISCOUNT = 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mapeamento de papéis para limite máximo de desconto
function getMaxDiscountForRoles(roles: AppRole[]): number {
  // Admin sempre pode aplicar até o máximo absoluto
  if (roles.includes('administrador')) {
    return MAX_ABSOLUTE_DISCOUNT;
  }

  // Buscar limites configurados no banco
  const limits = getDiscountLimitsSync();
  
  // PM de engenharia - pode aplicar até limite do diretor
  if (roles.includes('pm_engenharia')) {
    return Math.max(
      limits.BASE_DISCOUNT_LIMITS.directorApprovalRequired,
      limits.OPTIONS_DISCOUNT_LIMITS.directorApprovalRequired
    );
  }
  
  // Diretor comercial ou gerente comercial
  if (roles.includes('diretor_comercial') || roles.includes('gerente_comercial')) {
    return Math.max(
      limits.BASE_DISCOUNT_LIMITS.directorApprovalRequired,
      limits.OPTIONS_DISCOUNT_LIMITS.directorApprovalRequired
    );
  }
  
  // Vendedores, brokers, backoffice - limite sem aprovação
  return Math.max(
    limits.BASE_DISCOUNT_LIMITS.noApprovalRequired,
    limits.OPTIONS_DISCOUNT_LIMITS.noApprovalRequired
  );
}

export function validateQuotation(input: ValidationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validar campos obrigatórios
  if (!input.yacht_model_id) {
    errors.push("Modelo de iate é obrigatório");
  }

  if (!input.client_name?.trim()) {
    errors.push("Nome do cliente é obrigatório");
  }

  // 2. Validar email (se fornecido)
  if (input.client_email && !EMAIL_REGEX.test(input.client_email)) {
    errors.push("E-mail do cliente é inválido");
  }

  // 3. Validar descontos
  const baseDiscount = input.baseDiscountPercentage || 0;
  const optionsDiscount = input.optionsDiscountPercentage || 0;
  const maxDiscount = Math.max(baseDiscount, optionsDiscount);

  // 3a. Validar desconto máximo absoluto (30%)
  if (baseDiscount > MAX_ABSOLUTE_DISCOUNT) {
    errors.push(`Desconto base não pode exceder ${MAX_ABSOLUTE_DISCOUNT}%`);
  }

  if (optionsDiscount > MAX_ABSOLUTE_DISCOUNT) {
    errors.push(`Desconto de opcionais não pode exceder ${MAX_ABSOLUTE_DISCOUNT}%`);
  }

  // 3b. Validar desconto por papel do usuário
  if (input.userRoles.length > 0 && maxDiscount > 0) {
    const userMaxDiscount = getMaxDiscountForRoles(input.userRoles);
    
    if (maxDiscount > userMaxDiscount) {
      // Não é erro bloqueante se admin pode aprovar depois
      if (maxDiscount <= MAX_ABSOLUTE_DISCOUNT) {
        warnings.push(
          `Desconto de ${maxDiscount}% requer aprovação. Seu limite é ${userMaxDiscount}%`
        );
      }
    }
  }

  // 3c. Validar descontos negativos
  if (baseDiscount < 0) {
    errors.push("Desconto base não pode ser negativo");
  }

  if (optionsDiscount < 0) {
    errors.push("Desconto de opcionais não pode ser negativo");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Hook wrapper para uso reativo em componentes
export function useQuotationValidation(input: ValidationInput): ValidationResult {
  return validateQuotation(input);
}
