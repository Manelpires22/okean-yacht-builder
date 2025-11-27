/**
 * Hook para validação de cotações
 * Centraliza todas as validações de dados e regras de negócio
 */

import { AppRole } from "@/hooks/useUserRole";
import { getDiscountLimitsSync } from "@/lib/approval-utils";

/**
 * Dados de entrada para validação de cotação
 * @interface ValidationInput
 */
interface ValidationInput {
  /** ID do modelo de iate selecionado (UUID) */
  yacht_model_id?: string;
  /** Nome do cliente */
  client_name?: string;
  /** E-mail do cliente */
  client_email?: string;
  /** Percentual de desconto no preço base */
  baseDiscountPercentage?: number;
  /** Percentual de desconto nos opcionais */
  optionsDiscountPercentage?: number;
  /** Roles do usuário criando a cotação */
  userRoles: AppRole[];
}

/**
 * Resultado da validação de cotação
 * @interface ValidationResult
 */
interface ValidationResult {
  /** Indica se a cotação passou em todas as validações obrigatórias */
  isValid: boolean;
  /** Lista de erros bloqueantes (impedem salvamento) */
  errors: string[];
  /** Lista de avisos não-bloqueantes (ex: desconto requer aprovação) */
  warnings: string[];
}

const MAX_ABSOLUTE_DISCOUNT = 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Determina o limite máximo de desconto baseado nas roles do usuário
 * 
 * @description
 * Consulta os limites configurados no banco e retorna o maior desconto
 * que o usuário pode aplicar sem necessidade de aprovação adicional.
 * 
 * @param {AppRole[]} roles - Lista de roles do usuário
 * @returns {number} Percentual máximo de desconto permitido (0-30)
 * 
 * @example
 * ```typescript
 * const maxDiscount = getMaxDiscountForRoles(['comercial']);
 * console.log(maxDiscount); // 5 (limite sem aprovação)
 * 
 * const adminDiscount = getMaxDiscountForRoles(['administrador']);
 * console.log(adminDiscount); // 30 (limite absoluto)
 * ```
 */
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

/**
 * Valida todos os dados de uma cotação
 * 
 * @description
 * Centraliza todas as validações de negócio para cotações:
 * - Campos obrigatórios (modelo, cliente)
 * - Formato de e-mail
 * - Limites de desconto (absoluto: 30%, por role: variável)
 * - Validações de valores negativos
 * 
 * @param {ValidationInput} input - Dados da cotação para validar
 * @returns {ValidationResult} Resultado com isValid, errors e warnings
 * 
 * @example
 * ```typescript
 * const result = validateQuotation({
 *   yacht_model_id: 'uuid-123',
 *   client_name: 'João Silva',
 *   client_email: 'joao@email.com',
 *   baseDiscountPercentage: 15,
 *   userRoles: ['comercial']
 * });
 * 
 * if (!result.isValid) {
 *   console.error('Erros:', result.errors);
 * }
 * 
 * if (result.warnings.length > 0) {
 *   console.warn('Avisos:', result.warnings);
 *   // Ex: "Desconto de 15% requer aprovação. Seu limite é 5%"
 * }
 * ```
 * 
 * @see {@link useQuotationValidation} - Hook React para uso em componentes
 */
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

/**
 * Hook React para validação de cotações
 * 
 * @description
 * Wrapper de validateQuotation para uso reativo em componentes React.
 * Reavalia automaticamente quando os dados de entrada mudam.
 * 
 * @param {ValidationInput} input - Dados da cotação para validar
 * @returns {ValidationResult} Resultado da validação
 * 
 * @example
 * ```typescript
 * function QuotationForm({ formData }) {
 *   const validation = useQuotationValidation({
 *     yacht_model_id: formData.modelId,
 *     client_name: formData.clientName,
 *     client_email: formData.clientEmail,
 *     baseDiscountPercentage: formData.discount,
 *     userRoles: ['comercial']
 *   });
 * 
 *   return (
 *     <form>
 *       {validation.errors.map(err => (
 *         <Alert variant="destructive">{err}</Alert>
 *       ))}
 *       <Button disabled={!validation.isValid}>Salvar</Button>
 *     </form>
 *   );
 * }
 * ```
 * 
 * @see {@link validateQuotation} - Função de validação pura
 */
export function useQuotationValidation(input: ValidationInput): ValidationResult {
  return validateQuotation(input);
}
