import { useATOAggregatedImpact } from "@/hooks/useATOAggregatedImpact";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, AlertCircle } from "lucide-react";

interface ATODeliveryImpactCellProps {
  atoId: string;
  contractId: string;
  storedDeliveryDays: number;
}

/**
 * Célula que exibe o impacto de prazo de uma ATO
 * Calcula dinamicamente usando MAX dos itens (não soma)
 */
export function ATODeliveryImpactCell({ atoId, contractId, storedDeliveryDays }: ATODeliveryImpactCellProps) {
  const { data: aggregatedImpact, isLoading } = useATOAggregatedImpact(atoId, contractId);
  
  // Usar MAX calculado, fallback para valor armazenado
  const displayDays = aggregatedImpact?.maxDeliveryDaysImpact ?? storedDeliveryDays;
  const isDifferent = displayDays !== storedDeliveryDays && storedDeliveryDays !== 0;

  if (isLoading) {
    return <Skeleton className="h-5 w-16" />;
  }

  const content = (
    <div className="flex items-center gap-1">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className={displayDays > 0 ? "text-orange-600 font-semibold" : ""}>
        {displayDays > 0 ? "+" : ""}{displayDays} dias
      </span>
      {isDifferent && (
        <AlertCircle className="h-3 w-3 text-amber-500" />
      )}
    </div>
  );

  if (isDifferent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Impacto = MAX dos itens</p>
              <p className="text-xs text-muted-foreground">
                Soma armazenada: {storedDeliveryDays} dias
              </p>
              <p className="text-xs">
                O impacto real no prazo considera o item com maior tempo, 
                pois os trabalhos ocorrem em paralelo.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
