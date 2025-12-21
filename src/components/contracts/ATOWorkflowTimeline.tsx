import { CheckCircle2, Clock, XCircle, DollarSign, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ATOWorkflowTimelineProps {
  status: string;
  workflowStatus: string | null;
  className?: string;
}

const WORKFLOW_STEPS = [
  { key: 'pm_review', label: 'Análise PM', icon: Clock },
  { key: 'commercial_review', label: 'Validação Comercial', icon: DollarSign },
  { key: 'sent_to_client', label: 'Enviada ao Cliente', icon: Send },
  { key: 'approved', label: 'Aprovada', icon: CheckCircle2 },
];

// Determina qual etapa está ativa baseado em status + workflow_status
function getCurrentStepKey(status: string, workflowStatus: string | null): string {
  // Status finais primeiro
  if (status === 'rejected' || status === 'cancelled') return 'rejected';
  if (status === 'approved') return 'approved';
  
  // Se foi enviada ao cliente (pending_approval), o passo atual é "Aprovada" (aguardando)
  if (status === 'pending_approval') return 'approved';
  
  // Priorizar workflow_status para determinar etapa atual
  switch (workflowStatus) {
    case 'pending_pm_review':
      return 'pm_review';
    case 'needs_revision':
      return 'pm_review'; // Volta para PM
    case 'pending_commercial_review':
      return 'commercial_review';
    case 'completed':
      // Workflow completo, pronto para enviar ao cliente
      return 'sent_to_client';
    default:
      if (status === 'draft') return 'pm_review';
      return 'pm_review';
  }
}

export function ATOWorkflowTimeline({ status, workflowStatus, className }: ATOWorkflowTimelineProps) {
  // Se não tem workflow iniciado e está em draft, não mostrar timeline
  if (!workflowStatus && status === 'draft') {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-sm text-muted-foreground">Workflow não iniciado</p>
      </div>
    );
  }

  const currentStepKey = getCurrentStepKey(status, workflowStatus);
  const currentIndex = WORKFLOW_STEPS.findIndex(step => step.key === currentStepKey);
  const isRejected = status === 'rejected' || status === 'cancelled';
  const isNeedsRevision = workflowStatus === 'needs_revision';

  return (
    <div className={cn("relative", className)}>
      {/* Progress bar */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
        <div 
          className={cn(
            "h-full transition-all duration-500",
            isRejected ? "bg-destructive" : 
            isNeedsRevision ? "bg-orange-500" : 
            "bg-primary"
          )}
          style={{ 
            width: isRejected ? '100%' : `${(currentIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` 
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isComplete = status === 'approved' && step.key === 'approved';
          
          return (
            <div key={step.key} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-all",
                  isPast && "border-primary bg-primary text-primary-foreground",
                  isCurrent && !isRejected && !isNeedsRevision && "border-primary text-primary animate-pulse",
                  isCurrent && isNeedsRevision && "border-orange-500 text-orange-500 animate-pulse",
                  isComplete && "border-success bg-success text-success-foreground",
                  !isPast && !isCurrent && !isComplete && "border-muted-foreground/30 text-muted-foreground",
                  isRejected && isCurrent && "border-destructive bg-destructive text-destructive-foreground"
                )}
              >
                {isRejected && isCurrent ? (
                  <XCircle className="h-5 w-5" />
                ) : isComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isCurrent ? (
                  <Clock className="h-5 w-5" />
                ) : isPast ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center max-w-[80px]",
                  (isPast || isCurrent || isComplete) && "text-foreground",
                  !isPast && !isCurrent && !isComplete && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {isRejected && (
        <div className="mt-4 flex items-center justify-center gap-2 text-destructive">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Workflow Rejeitado</span>
        </div>
      )}

      {isNeedsRevision && (
        <div className="mt-4 flex items-center justify-center gap-2 text-orange-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Itens precisam de revisão</span>
        </div>
      )}
    </div>
  );
}
