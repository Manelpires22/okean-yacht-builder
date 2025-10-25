import { useMemo } from "react";

interface QuotationStatusInput {
  status: string;
  base_discount_percentage: number;
  options_discount_percentage: number;
  customizations?: Array<{ status: string }>;
  commercial_approval_status?: string;
  valid_until: string;
}

interface QuotationStatusResult {
  isReadyToSend: boolean;
  needsCommercialApproval: boolean;
  needsTechnicalApproval: boolean;
  commercialApproved: boolean;
  technicalApproved: boolean;
  isExpired: boolean;
  canEdit: boolean;
  canSend: boolean;
  canDelete: boolean;
}

export function useQuotationStatus(quotation: QuotationStatusInput | null): QuotationStatusResult {
  return useMemo(() => {
    if (!quotation) {
      return {
        isReadyToSend: false,
        needsCommercialApproval: false,
        needsTechnicalApproval: false,
        commercialApproved: false,
        technicalApproved: false,
        isExpired: false,
        canEdit: false,
        canSend: false,
        canDelete: false
      };
    }

    const maxDiscount = Math.max(
      quotation.base_discount_percentage || 0,
      quotation.options_discount_percentage || 0
    );

    const needsCommercialApproval = maxDiscount > 10;
    const commercialApproved = 
      !needsCommercialApproval || 
      quotation.commercial_approval_status === 'approved';

    const hasCustomizations = 
      quotation.customizations && quotation.customizations.length > 0;
    
    const needsTechnicalApproval = hasCustomizations || false;
    
    const technicalApproved = 
      !hasCustomizations || 
      quotation.customizations?.every(c => c.status === 'approved') || false;

    const validUntilDate = new Date(quotation.valid_until);
    const isExpired = validUntilDate < new Date();

    const isReadyToSend = 
      quotation.status === 'ready_to_send' &&
      commercialApproved &&
      technicalApproved &&
      !isExpired;

    const canEdit = quotation.status === 'draft';
    const canSend = isReadyToSend;
    const canDelete = quotation.status === 'draft';

    return {
      isReadyToSend,
      needsCommercialApproval,
      needsTechnicalApproval,
      commercialApproved,
      technicalApproved,
      isExpired,
      canEdit,
      canSend,
      canDelete
    };
  }, [quotation]);
}
