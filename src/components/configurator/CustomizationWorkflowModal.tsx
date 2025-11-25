import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { CustomizationContextView } from "./workflow/CustomizationContextView";
import { PMReviewForm } from "./workflow/PMReviewForm";
import { WorkflowDecisionPanel } from "./workflow/WorkflowDecisionPanel";
import { WorkflowTimeline } from "./workflow/WorkflowTimeline";

interface CustomizationWorkflowModalProps {
  customizationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WORKFLOW_STATUS_LABELS: Record<string, { label: string; variant: any; icon: any }> = {
  pending_pm_review: { label: 'Aguardando Análise PM', variant: 'secondary', icon: Clock },
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
  const isAdmin = roles.includes('administrador');

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="context">Contexto</TabsTrigger>
            <TabsTrigger value="analysis">Análise e Decisão</TabsTrigger>
          </TabsList>

          <TabsContent value="context" className="space-y-4">
            <CustomizationContextView customization={customization} />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {customization.workflow_status === 'pending_pm_review' && (isPM || isAdmin) && (
              <PMReviewForm customization={customization} />
            )}
            
            {customization.workflow_status === 'approved' && (
              <WorkflowDecisionPanel customization={customization} />
            )}
            
            {customization.workflow_status === 'rejected' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Customização Rejeitada</AlertTitle>
                <AlertDescription>
                  {customization.reject_reason || "Motivo não informado"}
                </AlertDescription>
              </Alert>
            )}
            
            {!['pending_pm_review', 'approved', 'rejected'].includes(customization.workflow_status) && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Aguardando Análise</AlertTitle>
                <AlertDescription>
                  O PM responsável está analisando esta customização.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
