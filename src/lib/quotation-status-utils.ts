/**
 * Utilitários para calcular o status final de uma cotação
 * baseado em aprovações comerciais e técnicas
 */

export type QuotationStatus =
  | 'draft'
  | 'pending_commercial_approval'
  | 'pending_technical_approval'
  | 'ready_to_send'
  | 'sent'
  | 'approved'
  | 'accepted'
  | 'rejected'
  | 'expired';

interface StatusCalculationInput {
  hasDiscounts: boolean;
  baseDiscount: number;
  optionsDiscount: number;
  hasCustomizations: boolean;
  commercialApproved: boolean;
  technicalApproved: boolean;
  isExpired: boolean;
  currentStatus: QuotationStatus;
}

/**
 * Calcula o status correto da cotação baseado nas aprovações
 */
export function calculateQuotationStatus({
  hasDiscounts,
  baseDiscount,
  optionsDiscount,
  hasCustomizations,
  commercialApproved,
  technicalApproved,
  isExpired,
  currentStatus
}: StatusCalculationInput): QuotationStatus {
  // Se já foi enviada, aprovada, aceita ou rejeitada, manter status
  if (['sent', 'approved', 'accepted', 'rejected'].includes(currentStatus)) {
    if (isExpired && currentStatus === 'sent') {
      return 'expired';
    }
    return currentStatus as QuotationStatus;
  }

  // Se expirada
  if (isExpired) {
    return 'expired';
  }

  // Se é rascunho e não tem nada para aprovar
  if (currentStatus === 'draft') {
    return 'draft';
  }

  const maxDiscount = Math.max(baseDiscount, optionsDiscount);
  const needsCommercialApproval = maxDiscount > 10;

  // Cenário 1: Sem descontos e sem customizações
  if (!needsCommercialApproval && !hasCustomizations) {
    return 'ready_to_send';
  }

  // Cenário 2: Tem descontos mas sem customizações
  if (needsCommercialApproval && !hasCustomizations) {
    return commercialApproved ? 'ready_to_send' : 'pending_commercial_approval';
  }

  // Cenário 3: Sem descontos mas tem customizações
  if (!needsCommercialApproval && hasCustomizations) {
    return technicalApproved ? 'ready_to_send' : 'pending_technical_approval';
  }

  // Cenário 4: Tem descontos E customizações
  if (needsCommercialApproval && hasCustomizations) {
    if (!commercialApproved && !technicalApproved) {
      return 'pending_commercial_approval'; // Prioriza comercial
    }
    if (commercialApproved && !technicalApproved) {
      return 'pending_technical_approval';
    }
    if (!commercialApproved && technicalApproved) {
      return 'pending_commercial_approval';
    }
    // Ambos aprovados
    return 'ready_to_send';
  }

  return currentStatus as QuotationStatus;
}

/**
 * Verifica se a cotação pode transitar para um novo status
 */
export function canTransitionTo(
  currentStatus: QuotationStatus,
  nextStatus: QuotationStatus
): boolean {
  const validTransitions: Record<QuotationStatus, QuotationStatus[]> = {
    draft: ['pending_commercial_approval', 'pending_technical_approval', 'ready_to_send'],
    pending_commercial_approval: ['ready_to_send', 'pending_technical_approval', 'rejected', 'draft'],
    pending_technical_approval: ['ready_to_send', 'pending_commercial_approval', 'rejected', 'draft'],
    ready_to_send: ['sent', 'draft'],
    sent: ['approved', 'accepted', 'rejected', 'expired'],
    approved: ['accepted'],
    accepted: [],
    rejected: ['draft'],
    expired: ['draft']
  };

  return validTransitions[currentStatus]?.includes(nextStatus) || false;
}
