import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface RevalidationIssue {
  type: 'price_change' | 'option_discontinued' | 'lead_time_change';
  message: string;
  oldValue?: string | number;
  newValue?: string | number;
  changePercentage?: number;
}

interface RevalidationAlertProps {
  issues: RevalidationIssue[];
  onRevalidate: () => void;
  isRevalidating?: boolean;
}

export function RevalidationAlert({ 
  issues, 
  onRevalidate, 
  isRevalidating = false 
}: RevalidationAlertProps) {
  if (!issues || issues.length === 0) {
    return null;
  }

  const hasCriticalIssues = issues.some(
    issue => issue.type === 'option_discontinued' || 
    (issue.type === 'price_change' && (issue.changePercentage || 0) > 5)
  );

  return (
    <Alert variant={hasCriticalIssues ? "destructive" : "default"} className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {hasCriticalIssues 
          ? "Atenção: Mudanças Críticas Detectadas" 
          : "Alertas de Revalidação"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p className="text-sm">
            Esta proposta foi criada há algum tempo e detectamos as seguintes mudanças:
          </p>
          
          <ul className="list-disc list-inside space-y-1 text-sm">
            {issues.map((issue, index) => (
              <li key={index}>
                {issue.message}
                {issue.changePercentage && (
                  <span className="font-medium">
                    {" "}({issue.changePercentage > 0 ? '+' : ''}{issue.changePercentage.toFixed(1)}%)
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={onRevalidate}
              disabled={isRevalidating}
              variant={hasCriticalIssues ? "default" : "outline"}
            >
              {isRevalidating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Revalidando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Revalidar Proposta
                </>
              )}
            </Button>
            
            {hasCriticalIssues && (
              <p className="text-sm text-muted-foreground self-center">
                Recomendamos criar uma nova revisão da proposta
              </p>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
