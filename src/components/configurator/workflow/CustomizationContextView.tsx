import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { Calendar, FileText, Package, Clock } from "lucide-react";
import type { CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomizationContextViewProps {
  customization: CustomizationWorkflow;
}

export function CustomizationContextView({ customization }: CustomizationContextViewProps) {
  const { quotations, workflow_steps } = customization;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Resumo da Cotação */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Resumo da Cotação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Modelo</p>
              <p className="font-medium">{quotations.yacht_models.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Código</p>
              <p className="font-medium">{quotations.yacht_models.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{quotations.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Número da Cotação</p>
              <p className="font-medium">{quotations.quotation_number}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Preço Base</span>
              <span className="font-medium">{formatCurrency(quotations.base_price)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Opcionais</span>
              <span className="font-medium">{formatCurrency(quotations.total_options_price)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Prazo Base</span>
              <span className="font-medium">{quotations.base_delivery_days} dias</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impacto Estimado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Impacto Estimado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-muted-foreground mt-1" />
            <div className="flex-1">
              <p className="text-sm font-medium">Customização</p>
              <p className="text-xs text-muted-foreground">{customization.item_name}</p>
              {(customization as any).customization_code && (
                <p className="text-xs font-mono text-primary mt-1">
                  {(customization as any).customization_code}
                </p>
              )}
            </div>
          </div>

          {customization.pm_final_price > 0 && (
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">Preço Adicional</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(customization.pm_final_price)}
                </p>
              </div>
            </div>
          )}

          {customization.pm_final_delivery_impact_days > 0 && (
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">Impacto no Prazo</p>
                <p className="text-lg font-bold text-primary">
                  +{customization.pm_final_delivery_impact_days} dias
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline do Workflow */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico do Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow_steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma etapa registrada ainda.</p>
            ) : (
              workflow_steps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'pending' ? 'bg-yellow-500' :
                      step.status === 'rejected' ? 'bg-red-500' :
                      'bg-gray-300'
                    }`} />
                    {index < workflow_steps.length - 1 && (
                      <div className="w-0.5 h-12 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {step.step_type === 'pm_initial' && 'PM Inicial'}
                          {step.step_type === 'supply_quote' && 'Cotação Supply'}
                          {step.step_type === 'planning_check' && 'Validação Planejamento'}
                          {step.step_type === 'pm_final' && 'PM Final'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {step.assigned_user?.full_name || 'Não atribuído'}
                        </p>
                        {step.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{step.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          step.status === 'completed' ? 'default' :
                          step.status === 'pending' ? 'secondary' :
                          step.status === 'rejected' ? 'destructive' :
                          'outline'
                        } className={step.status === 'completed' ? 'bg-green-600' : ''}>
                          {step.status === 'completed' && 'Concluído'}
                          {step.status === 'pending' && 'Pendente'}
                          {step.status === 'rejected' && 'Rejeitado'}
                          {step.status === 'skipped' && 'Pulado'}
                        </Badge>
                        {step.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(step.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
