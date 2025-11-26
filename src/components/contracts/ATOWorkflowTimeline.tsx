import { CheckCircle2, Clock, XCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ATOWorkflowTimelineProps {
  currentStatus: string | null;
  className?: string;
}

const WORKFLOW_STEPS = [
  { key: 'pending_pm_review', label: 'Análise PM', icon: Clock },
  { key: 'pending_commercial', label: 'Validação Comercial', icon: DollarSign },
  { key: 'completed', label: 'Aprovado', icon: CheckCircle2 },
];

export function ATOWorkflowTimeline({ currentStatus, className }: ATOWorkflowTimelineProps) {
  if (!currentStatus) {
    return (
      <div className={cn("text-center py-4", className)}>
        <p className="text-sm text-muted-foreground">Sem workflow técnico</p>
      </div>
    );
  }

  const currentIndex = WORKFLOW_STEPS.findIndex(step => step.key === currentStatus);
  const isRejected = currentStatus === 'rejected';

  return (
    <div className={cn("relative", className)}>
      {/* Progress bar */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
        <div 
          className={cn(
            "h-full transition-all duration-500",
            isRejected ? "bg-destructive" : "bg-primary"
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
          const isComplete = currentStatus === 'completed' && step.key === 'completed';
          
          return (
            <div key={step.key} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-all",
                  isPast && "border-primary bg-primary text-primary-foreground",
                  isCurrent && !isRejected && "border-primary text-primary animate-pulse",
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
    </div>
  );
}
