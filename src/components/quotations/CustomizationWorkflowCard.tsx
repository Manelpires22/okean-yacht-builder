import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Workflow, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CustomizationWorkflowModal } from "@/components/configurator/CustomizationWorkflowModal";
import { useState } from "react";

interface CustomizationWorkflowCardProps {
  quotationId: string;
}

const WORKFLOW_STATUS_LABELS: Record<string, { label: string; variant: any; icon: any }> = {
  pending_pm_review: { label: 'Aguardando PM', variant: 'secondary', icon: Clock },
  approved: { label: 'Aprovado', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', variant: 'destructive', icon: XCircle },
};

export function CustomizationWorkflowCard({ quotationId }: CustomizationWorkflowCardProps) {
  const [selectedCustomizationId, setSelectedCustomizationId] = useState<string | null>(null);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  const { data: customizations, isLoading } = useQuery({
    queryKey: ['quotation-customizations-workflow', quotationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotation_customizations')
        .select(`
          id,
          item_name,
          workflow_status,
          status,
          notes,
          pm_final_price,
          pm_final_delivery_impact_days,
          created_at,
          reviewed_at,
          customization_code,
          workflow_steps:customization_workflow_steps (
            id,
            step_type,
            status,
            completed_at
          )
        `)
        .eq('quotation_id', quotationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!quotationId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Workflow de Customizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!customizations || customizations.length === 0) {
    return null;
  }

  const handleOpenWorkflow = (customizationId: string) => {
    setSelectedCustomizationId(customizationId);
    setWorkflowModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Workflow de Customizações ({customizations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customizations.map((customization) => {
              const statusInfo = WORKFLOW_STATUS_LABELS[customization.workflow_status] || {
                label: customization.workflow_status,
                variant: 'secondary',
                icon: Clock,
              };
              const Icon = statusInfo.icon;

              // Workflow simplificado: 2 etapas (solicitação + aprovação PM)
              const totalSteps = 2;
              const completedSteps = customization.workflow_status === 'approved' || customization.workflow_status === 'rejected' ? 2 : 1;

              return (
                <div
                  key={customization.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{customization.item_name}</h4>
                        {customization.customization_code && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {customization.customization_code}
                          </span>
                        )}
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {customization.notes}
                      </p>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Progresso: </span>
                          <span className="font-medium">
                            {completedSteps}/{totalSteps} etapas
                          </span>
                        </div>
                        {customization.workflow_status === 'approved' && customization.pm_final_price > 0 && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Custo: </span>
                              <span className="font-medium">
                                R$ {customization.pm_final_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            {customization.pm_final_delivery_impact_days > 0 && (
                              <div>
                                <span className="text-muted-foreground">Impacto: </span>
                                <span className="font-medium">
                                  +{customization.pm_final_delivery_impact_days} dias
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Criado em {format(new Date(customization.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {customization.reviewed_at && (
                          <span>
                            Aprovado em {format(new Date(customization.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenWorkflow(customization.id)}
                      className="ml-4"
                    >
                      <Workflow className="h-4 w-4 mr-2" />
                      Ver Workflow
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CustomizationWorkflowModal
        customizationId={selectedCustomizationId}
        open={workflowModalOpen}
        onOpenChange={setWorkflowModalOpen}
      />
    </>
  );
}
