import { useMemo } from "react";

export interface PendingWorkflowDetail {
  customizationId: string;
  itemName: string;
  workflowStatus: string;
}

export interface QuotationApprovalStatus {
  hasPendingWorkflows: boolean;
  hasPendingCommercialApproval: boolean;
  pendingWorkflowsCount: number;
  allApprovalsComplete: boolean;
  nextStep: 'awaiting_approvals' | 'ready_to_send';
  pendingWorkflowDetails: PendingWorkflowDetail[];
}

interface QuotationApprovalInput {
  base_discount_percentage: number;
  options_discount_percentage: number;
  customizations?: Array<{
    id: string;
    item_name: string;
    status: string;
    workflow_status?: string | null;
  }>;
}

export function useQuotationApprovalStatus(
  quotation: QuotationApprovalInput | null
): QuotationApprovalStatus {
  return useMemo(() => {
    if (!quotation) {
      return {
        hasPendingWorkflows: false,
        hasPendingCommercialApproval: false,
        pendingWorkflowsCount: 0,
        allApprovalsComplete: true,
        nextStep: 'ready_to_send',
        pendingWorkflowDetails: []
      };
    }

    // Verificar workflows pendentes (customizações com workflow_status !== 'approved')
    // CORREÇÃO: API retorna "quotation_customizations", não "customizations"
    const customizations = (quotation as any).quotation_customizations || quotation.customizations || [];
    
    const pendingWorkflows = customizations.filter((c: any) => 
      c.workflow_status && c.workflow_status !== 'approved'
    );

    const pendingWorkflowDetails: PendingWorkflowDetail[] = pendingWorkflows.map(c => ({
      customizationId: c.id,
      itemName: c.item_name,
      workflowStatus: c.workflow_status || 'pending'
    }));

    // Aprovação comercial não é mais rastreada via tabela approvals
    // No novo workflow, descontos são validados diretamente no momento da criação
    const hasPendingCommercialApproval = false;

    // Status consolidado
    const hasPendingWorkflows = pendingWorkflows.length > 0;
    const allApprovalsComplete = !hasPendingWorkflows && !hasPendingCommercialApproval;

    return {
      hasPendingWorkflows,
      hasPendingCommercialApproval,
      pendingWorkflowsCount: pendingWorkflows.length,
      allApprovalsComplete,
      nextStep: allApprovalsComplete ? 'ready_to_send' : 'awaiting_approvals',
      pendingWorkflowDetails
    };
  }, [quotation]);
}
