import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";

interface WorkflowDecisionPanelProps {
  customization: CustomizationWorkflow;
  canEdit: boolean;
}

const CHECKLIST_ITEMS: Record<string, string[]> = {
  pending_pm_review: [
    'Escopo técnico definido',
    'Horas de engenharia estimadas',
    'Peças preliminares listadas',
  ],
  pending_supply_quote: [
    'Itens cotados com fornecedores',
    'Preços e prazos definidos',
    'Lead time crítico identificado',
  ],
  pending_planning_validation: [
    'Janela de inserção avaliada',
    'Impacto no prazo calculado',
    'Conflitos de capacidade resolvidos',
  ],
  pending_pm_final_approval: [
    'Preço de venda definido',
    'Impacto final no prazo confirmado',
    'Notas ao vendedor adicionadas',
  ],
};

export function WorkflowDecisionPanel({ customization, canEdit }: WorkflowDecisionPanelProps) {
  const workflowStatus = customization.workflow_status;
  const checklistItems = CHECKLIST_ITEMS[workflowStatus] || [];

  const isComplete = (item: string): boolean => {
    if (workflowStatus === 'pending_pm_review') {
      if (item.includes('Escopo')) return !!customization.pm_scope;
      if (item.includes('Horas')) return customization.engineering_hours > 0;
      if (item.includes('Peças')) return customization.required_parts?.length > 0;
    }
    if (workflowStatus === 'pending_supply_quote') {
      if (item.includes('Itens')) return customization.supply_items?.length > 0;
      if (item.includes('Preços')) return customization.supply_cost > 0;
      if (item.includes('Lead time')) return customization.supply_lead_time_days > 0;
    }
    if (workflowStatus === 'pending_planning_validation') {
      if (item.includes('Janela')) return !!customization.planning_window_start;
      if (item.includes('Impacto')) return customization.planning_delivery_impact_days >= 0;
      if (item.includes('Conflitos')) return true; // Assume resolved if filled
    }
    if (workflowStatus === 'pending_pm_final_approval') {
      if (item.includes('Preço')) return customization.pm_final_price > 0;
      if (item.includes('Impacto')) return customization.pm_final_delivery_impact_days >= 0;
      if (item.includes('Notas')) return true; // Optional
    }
    return false;
  };

  const totalImpact = customization.pm_final_price || 0;
  const deliveryImpact = customization.pm_final_delivery_impact_days || 
                         customization.planning_delivery_impact_days || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checklist de Consistência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {isComplete(item) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span className={isComplete(item) ? 'text-foreground' : 'text-muted-foreground'}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview de Impacto na Cotação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Preço Base + Opcionais:</span>
              <span className="font-medium">
                {formatCurrency(
                  customization.quotations.base_price + customization.quotations.total_options_price
                )}
              </span>
            </div>
            {totalImpact > 0 && (
              <div className="flex justify-between items-center text-primary">
                <span className="text-sm font-medium">+ Customização:</span>
                <span className="font-bold">{formatCurrency(totalImpact)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Total Estimado:</span>
              <span className="font-bold text-lg">
                {formatCurrency(
                  customization.quotations.base_price + 
                  customization.quotations.total_options_price + 
                  totalImpact
                )}
              </span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Prazo Original:</span>
              <span className="font-medium">{customization.quotations.base_delivery_days} dias</span>
            </div>
            {deliveryImpact > 0 && (
              <div className="flex justify-between items-center text-primary">
                <span className="text-sm font-medium">+ Impacto:</span>
                <span className="font-bold">+{deliveryImpact} dias</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Prazo Total:</span>
              <span className="font-bold text-lg">
                {customization.quotations.base_delivery_days + deliveryImpact} dias
              </span>
            </div>
          </div>

          {workflowStatus === 'pending_pm_final_approval' && totalImpact > 50000 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <Badge variant="secondary" className="mr-2">Atenção</Badge>
                Poderá disparar aprovação comercial automática
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {!canEdit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta customização está aguardando ação de outro departamento. 
            Você será notificado quando for sua vez de atuar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
