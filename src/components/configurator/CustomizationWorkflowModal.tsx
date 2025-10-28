import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Clock, CheckCircle2, XCircle, Package, Calendar, DollarSign } from "lucide-react";
import { CustomizationContextView } from "./workflow/CustomizationContextView";
import { PMInitialForm } from "./workflow/PMInitialForm";
import { SupplyQuoteForm } from "./workflow/SupplyQuoteForm";
import { PlanningValidationForm } from "./workflow/PlanningValidationForm";
import { PMFinalForm } from "./workflow/PMFinalForm";
import { WorkflowDecisionPanel } from "./workflow/WorkflowDecisionPanel";
import { WorkflowTimeline } from "./workflow/WorkflowTimeline";

interface CustomizationWorkflowModalProps {
  customizationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WORKFLOW_STATUS_LABELS: Record<string, { label: string; variant: any; icon: any }> = {
  pending_pm_review: { label: 'Aguardando PM Inicial', variant: 'secondary', icon: Clock },
  pending_supply_quote: { label: 'Aguardando Supply', variant: 'default', icon: Package },
  pending_planning_validation: { label: 'Aguardando Planejamento', variant: 'default', icon: Calendar },
  pending_pm_final_approval: { label: 'Aguardando PM Final', variant: 'default', icon: DollarSign },
  approved: { label: 'Aprovado', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', variant: 'destructive', icon: XCircle },
};

export function CustomizationWorkflowModal({
  customizationId,
  open,
  onOpenChange,
}: CustomizationWorkflowModalProps) {
  const { data: customization, isLoading } = useCustomizationWorkflow(customizationId);
  const { data: userRoles } = useUserRole();

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!customization) {
    return null;
  }

  const workflowStatus = customization.workflow_status;
  const statusInfo = WORKFLOW_STATUS_LABELS[workflowStatus] || { label: workflowStatus, variant: 'secondary', icon: Clock };
  const StatusIcon = statusInfo.icon;

  const roles = (userRoles as any)?.roles || [];
  const isPM = roles.includes('pm_engenharia');
  const isBuyer = roles.includes('comprador');
  const isPlanner = roles.includes('planejador');
  const isAdmin = roles.includes('administrador');

  const canViewPMInitial = (isPM || isAdmin) && workflowStatus === 'pending_pm_review';
  const canViewSupply = (isBuyer || isAdmin) && workflowStatus === 'pending_supply_quote';
  const canViewPlanning = (isPlanner || isAdmin) && workflowStatus === 'pending_planning_validation';
  const canViewPMFinal = (isPM || isAdmin) && workflowStatus === 'pending_pm_final_approval';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{customization.item_name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Cotação: {customization.quotations.quotation_number} • {customization.quotations.client_name}
              </p>
            </div>
            <Badge variant={statusInfo.variant} className="flex items-center gap-1.5">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* Timeline Visual */}
        <WorkflowTimeline currentStatus={workflowStatus} className="mt-6 mb-4" />

        <Tabs defaultValue="analysis" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="context">Contexto</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="decision">Decisão</TabsTrigger>
          </TabsList>

          <TabsContent value="context" className="space-y-4">
            <CustomizationContextView customization={customization} />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {canViewPMInitial && (
              <PMInitialForm customization={customization} />
            )}

            {canViewSupply && (
              <SupplyQuoteForm customization={customization} />
            )}

            {canViewPlanning && (
              <PlanningValidationForm customization={customization} />
            )}

            {canViewPMFinal && (
              <PMFinalForm customization={customization} />
            )}

            {!canViewPMInitial && !canViewSupply && !canViewPlanning && !canViewPMFinal && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Você não tem permissão para editar esta etapa do workflow.</p>
                <p className="text-sm mt-2">Status atual: {statusInfo.label}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="decision" className="space-y-4">
            <WorkflowDecisionPanel
              customization={customization}
              canEdit={canViewPMInitial || canViewSupply || canViewPlanning || canViewPMFinal}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
