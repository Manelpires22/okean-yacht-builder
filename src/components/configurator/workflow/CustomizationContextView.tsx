import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { Calendar, FileText, Package, Clock, Wrench, Box, CalendarCheck, Truck } from "lucide-react";
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
              <span className="text-sm text-muted-foreground">Entrega Prevista</span>
              <span className="font-medium">
                {(quotations as any).hull_numbers?.estimated_delivery_date 
                  ? format(new Date((quotations as any).hull_numbers.estimated_delivery_date), "dd/MM/yyyy", { locale: ptBR })
                  : `${quotations.base_delivery_days} dias`}
              </span>
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

      {/* Análise do PM Inicial */}
      {customization.pm_scope && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Análise do PM Inicial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Escopo Técnico</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{customization.pm_scope}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Horas de Engenharia</p>
                <p className="text-lg font-semibold">{customization.engineering_hours || 0}h</p>
              </div>
              {customization.required_parts && customization.required_parts.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Peças Necessárias</p>
                  <div className="flex flex-wrap gap-2">
                    {(customization.required_parts as string[]).map((part, idx) => (
                      <Badge key={idx} variant="outline">
                        {part}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cotação de Materiais */}
      {customization.supply_cost > 0 && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="h-5 w-5" />
              Cotação de Materiais (Supply)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customization.supply_items && (
              <div>
                <p className="text-sm font-medium mb-2">Itens Cotados</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(customization.supply_items as any[]).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.name || item.item || '-'}</TableCell>
                        <TableCell>{item.supplier || item.fornecedor || '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity || item.quantidade || '-'}</TableCell>
                        <TableCell className="text-right">
                          {item.unit_price ? formatCurrency(item.unit_price) : 
                           item.preco_unitario ? formatCurrency(item.preco_unitario) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.total ? formatCurrency(item.total) : 
                           item.unit_price && item.quantity ? formatCurrency(item.unit_price * item.quantity) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Custo Total de Materiais</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(customization.supply_cost)}</p>
              </div>
              {customization.supply_lead_time_days > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Prazo de Fornecimento</p>
                  <p className="text-lg font-semibold">{customization.supply_lead_time_days} dias</p>
                </div>
              )}
              {customization.supply_notes && (
                <div className="col-span-3">
                  <p className="text-sm text-muted-foreground mb-1">Observações do Comprador</p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{customization.supply_notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validação de Planejamento */}
      {customization.planning_notes && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Validação de Planejamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {customization.planning_window_start && (
                <div>
                  <p className="text-sm text-muted-foreground">Janela de Produção</p>
                  <p className="font-medium">
                    {format(new Date(customization.planning_window_start), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              {customization.planning_delivery_impact_days > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Impacto no Prazo</p>
                  <p className="text-lg font-semibold text-primary">
                    +{customization.planning_delivery_impact_days} dias
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Observações do Planejador</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{customization.planning_notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                          {step.step_type === 'pm_review' && 'Análise PM'}
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
