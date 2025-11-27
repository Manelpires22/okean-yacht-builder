import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateQuotation } from '../useQuotationValidation';

// Mock do approval-utils para controlar limites de desconto
vi.mock('@/lib/approval-utils', () => ({
  getDiscountLimitsSync: vi.fn(() => ({
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
  }))
}));

describe('useQuotationValidation', () => {
  describe('Validação de campos obrigatórios', () => {
    it('deve validar cotação completa e válida', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        client_email: 'joao@example.com',
        baseDiscountPercentage: 5,
        optionsDiscountPercentage: 5,
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve retornar erro se yacht_model_id estiver ausente', () => {
      const result = validateQuotation({
        yacht_model_id: '',
        client_name: 'João Silva',
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Modelo de iate é obrigatório');
    });

    it('deve retornar erro se client_name estiver ausente', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: '',
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome do cliente é obrigatório');
    });

    it('deve retornar erro se client_name tiver apenas espaços', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: '   ',
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Nome do cliente é obrigatório');
    });
  });

  describe('Validação de email', () => {
    it('deve aceitar email válido', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        client_email: 'joao.silva@example.com',
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve retornar erro para email inválido', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        client_email: 'email-invalido',
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('E-mail do cliente é inválido');
    });

    it('deve aceitar email vazio (opcional)', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        client_email: '',
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(true);
    });

    it('deve aceitar email undefined (opcional)', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('Validação de desconto máximo absoluto (30%)', () => {
    it('deve retornar erro se desconto base > 30%', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 35,
        optionsDiscountPercentage: 0,
        userRoles: ['administrador'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Desconto base não pode exceder 30%');
    });

    it('deve retornar erro se desconto de opcionais > 30%', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 0,
        optionsDiscountPercentage: 40,
        userRoles: ['administrador'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Desconto de opcionais não pode exceder 30%');
    });

    it('deve aceitar desconto exatamente de 30%', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 30,
        optionsDiscountPercentage: 0,
        userRoles: ['administrador'],
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Validação de descontos negativos', () => {
    it('deve retornar erro para desconto base negativo', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: -5,
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Desconto base não pode ser negativo');
    });

    it('deve retornar erro para desconto de opcionais negativo', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        optionsDiscountPercentage: -10,
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Desconto de opcionais não pode ser negativo');
    });
  });

  describe('Warnings de desconto por role (não bloqueante)', () => {
    it('vendedor: desconto até 10% não gera warning', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 10,
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('vendedor: desconto 15% gera warning (requer aprovação)', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 15,
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(true); // Não bloqueia!
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('requer aprovação');
    });

    it('administrador: desconto 30% não gera warning', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 30,
        userRoles: ['administrador'],
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('diretor_comercial: desconto 15% não gera warning', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 15,
        userRoles: ['diretor_comercial'],
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('pm_engenharia: desconto 15% não gera warning', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 15,
        userRoles: ['pm_engenharia'],
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Múltiplos erros', () => {
    it('deve retornar todos os erros encontrados', () => {
      const result = validateQuotation({
        yacht_model_id: '',
        client_name: '',
        client_email: 'email-invalido',
        baseDiscountPercentage: 50,
        optionsDiscountPercentage: -5,
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.errors).toContain('Modelo de iate é obrigatório');
      expect(result.errors).toContain('Nome do cliente é obrigatório');
      expect(result.errors).toContain('E-mail do cliente é inválido');
      expect(result.errors).toContain('Desconto base não pode exceder 30%');
    });
  });

  describe('Casos extremos', () => {
    it('deve lidar com userRoles vazio', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        baseDiscountPercentage: 20,
        userRoles: [],
      });

      expect(result.isValid).toBe(true);
      // Sem roles, não valida limite por role
      expect(result.warnings).toHaveLength(0);
    });

    it('deve lidar com valores undefined para descontos', () => {
      const result = validateQuotation({
        yacht_model_id: 'model-123',
        client_name: 'João Silva',
        userRoles: ['vendedor'],
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
