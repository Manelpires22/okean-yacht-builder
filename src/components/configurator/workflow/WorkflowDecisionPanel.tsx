import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Clock, AlertCircle, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { type CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface WorkflowDecisionPanelProps {
  customization: CustomizationWorkflow;
}

const CHECKLIST_ITEMS: Record<string, string[]> = {
  pending_pm_review: [
    'Escopo técnico definido',
    'Preço de venda definido',
    'Impacto no prazo calculado',
    'Peças necessárias listadas',
  ],
};

export function WorkflowDecisionPanel({ customization }: WorkflowDecisionPanelProps) {
  const workflowStatus = customization.workflow_status;
  const checklistItems = CHECKLIST_ITEMS[workflowStatus] || [];

  const isComplete = (item: string): boolean => {
    if (workflowStatus === 'pending_pm_review') {
      if (item.includes('Escopo')) return !!customization.pm_scope;
      if (item.includes('Preço')) return customization.pm_final_price > 0;
      if (item.includes('Impacto')) return customization.pm_final_delivery_impact_days >= 0;
      if (item.includes('Peças')) return customization.required_parts?.length > 0;
    }
    return false;
  };

  const estimatedPrice = customization.pm_final_price || 0;
  const estimatedDelivery = customization.pm_final_delivery_impact_days || 0;

  return (
    <div className="space-y-6">
      {/* Preview de Impacto - Destacado */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Preview de Impacto na Cotação
          </CardTitle>
          <CardDescription>
            Impacto estimado desta customização no valor e prazo total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preço */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Adicional ao Preço</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-bold",
                  estimatedPrice > 0 ? "text-primary" : "text-muted-foreground"
                )}>
                  {estimatedPrice > 0 ? formatCurrency(estimatedPrice) : "Pendente"}
                </span>
                {estimatedPrice > 0 && (
                  <Badge variant="outline" className="text-xs">
                    +{((estimatedPrice / customization.quotations.base_price) * 100).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Prazo */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Adicional ao Prazo</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-bold",
                  estimatedDelivery > 0 ? "text-primary" : "text-muted-foreground"
                )}>
                  {estimatedDelivery > 0 ? `+${estimatedDelivery}` : "Pendente"}
                </span>
                {estimatedDelivery > 0 && (
                  <span className="text-lg text-muted-foreground">dias</span>
                )}
              </div>
            </div>
          </div>

          {/* Totais */}
          {estimatedPrice > 0 && (
            <div className="mt-6 pt-6 border-t space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">Novo Total da Cotação:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Preço Total:</span>
                  <p className="text-lg font-bold">
                    {formatCurrency(
                      customization.quotations.base_price + 
                      customization.quotations.total_options_price + 
                      estimatedPrice
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prazo Total:</span>
                  <p className="text-lg font-bold">
                    {customization.quotations.base_delivery_days + estimatedDelivery} dias
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist de Consistência */}
      {checklistItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Checklist de Consistência</CardTitle>
            <CardDescription>
              Verifique se todas as informações necessárias foram preenchidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklistItems.map((item, index) => {
                const completed = isComplete(item);
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      completed && "bg-success/5 border-success/20"
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={completed ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {workflowStatus === 'pending_pm_review' && estimatedPrice > 50000 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Este valor pode disparar aprovação comercial automática após finalização.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
