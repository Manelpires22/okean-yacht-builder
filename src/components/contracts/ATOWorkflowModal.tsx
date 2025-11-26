import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useATOWorkflow, ATOWorkflowStep } from "@/hooks/useATOWorkflow";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ATOWorkflowTimeline } from "./ATOWorkflowTimeline";
import { ATOPMReviewForm } from "./ATOPMReviewForm";

interface ATOWorkflowModalProps {
  atoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ATOWorkflowModal({ atoId, open, onOpenChange }: ATOWorkflowModalProps) {
  const { data: atoWorkflow, isLoading } = useATOWorkflow(atoId || undefined);

  const currentStep = atoWorkflow?.workflow_steps?.find(
    (step: ATOWorkflowStep) => step.status === 'pending'
  );

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!atoWorkflow) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>ATO não encontrada ou sem workflow ativo.</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  const isCompleted = atoWorkflow.workflow_status === 'completed';
  const isRejected = atoWorkflow.workflow_status === 'rejected';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Workflow: {atoWorkflow.ato_number} - {atoWorkflow.title}
          </DialogTitle>
          <DialogDescription>
            Contrato: {atoWorkflow.contract.contract_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timeline */}
          <ATOWorkflowTimeline
            currentStatus={atoWorkflow.workflow_status}
            className="mb-6"
          />

          {/* Status Completado/Rejeitado */}
          {isCompleted && (
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Workflow concluído! ATO aprovada e valores consolidados no contrato.
              </AlertDescription>
            </Alert>
          )}

          {isRejected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Workflow rejeitado. A ATO não será aplicada ao contrato.
              </AlertDescription>
            </Alert>
          )}

          {/* Form do Step Atual */}
          {!isCompleted && !isRejected && currentStep && (
            <>
              {currentStep.step_type === 'pm_review' && (
                <ATOPMReviewForm atoWorkflow={atoWorkflow} currentStep={currentStep} />
              )}
            </>
          )}

          {/* Histórico de Steps Completados */}
          {atoWorkflow.workflow_steps && atoWorkflow.workflow_steps.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Histórico</h3>
              {atoWorkflow.workflow_steps
                .filter((step: ATOWorkflowStep) => step.status !== 'pending')
                .map((step: ATOWorkflowStep) => (
                  <div key={step.id} className="text-xs text-muted-foreground border-l-2 border-primary pl-3 py-1">
                    <span className="font-medium">{step.step_type}</span>:{' '}
                    <span className={step.status === 'completed' ? 'text-success' : 'text-destructive'}>
                      {step.status}
                    </span>
                    {step.notes && <span> - {step.notes}</span>}
                  </div>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
