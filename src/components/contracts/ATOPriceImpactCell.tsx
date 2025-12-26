import { useATORealPriceImpact } from "@/hooks/useATORealPriceImpact";
import { formatCurrency } from "@/lib/quotation-utils";
import { DollarSign, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ATOPriceImpactCellProps {
  atoId: string;
  contractId: string;
  storedPriceImpact: number;
}

/**
 * Célula que exibe o impacto real de preço de uma ATO
 * Calcula dinamicamente considerando deltas de upgrades substituídos
 */
export function ATOPriceImpactCell({ atoId, contractId, storedPriceImpact }: ATOPriceImpactCellProps) {
  const { data: realImpact, isLoading } = useATORealPriceImpact(atoId, contractId);
  
  const displayPrice = realImpact?.totalImpact ?? storedPriceImpact;
  const hasReplacements = (realImpact?.upgradeDeltaDetails?.filter(d => d.isReplacement).length ?? 0) > 0;
  const isDifferent = hasReplacements && Math.abs(storedPriceImpact - displayPrice) > 1;

  if (isLoading) {
    return <Skeleton className="h-5 w-24" />;
  }

  const content = (
    <div className="flex items-center gap-1">
      <DollarSign className="h-4 w-4 text-muted-foreground" />
      <span
        className={
          displayPrice > 0
            ? "text-orange-600 font-semibold"
            : displayPrice < 0
            ? "text-blue-600 font-semibold"
            : ""
        }
      >
        {displayPrice >= 0 ? "+" : ""}
        {formatCurrency(displayPrice)}
      </span>
      {hasReplacements && (
        <RefreshCw className="h-3 w-3 text-blue-500 ml-1" />
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
              <p className="font-medium">Impacto ajustado por substituições</p>
              <p className="text-xs text-muted-foreground">
                Soma bruta: {formatCurrency(storedPriceImpact)}
              </p>
              <p className="text-xs">
                Alguns upgrades substituem outros do contrato original, 
                então o impacto real é o delta entre eles.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
