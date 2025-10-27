import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileEdit, Clock, CheckCircle2, XCircle, AlertCircle, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import { RequestContractRevisionDialog } from "./RequestContractRevisionDialog";

interface ContractRevisionsTabProps {
  contractId: string;
  quotationId: string;
}

export function ContractRevisionsTab({ contractId, quotationId }: ContractRevisionsTabProps) {
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  const { data: revisions, isLoading } = useQuery({
    queryKey: ["contract-revisions", quotationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_customizations")
        .select("*")
        .eq("quotation_id", quotationId)
        .eq("included_in_contract", false) // Only post-contract revisions
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!quotationId,
  });

  const getStatusBadge = (status: string, workflowStatus: string) => {
    if (status === "approved") {
      return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
    }
    if (status === "rejected") {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
    }
    
    // Workflow status badges
    const workflowLabels: Record<string, { label: string; icon: any }> = {
      pending_pm_review: { label: "Aguardando PM", icon: Clock },
      pm_review_completed: { label: "PM Revisado", icon: CheckCircle2 },
      pending_supply_quote: { label: "Aguardando Suprimentos", icon: Clock },
      supply_quote_completed: { label: "Cotação Pronta", icon: CheckCircle2 },
      pending_planning: { label: "Aguardando Planejamento", icon: Clock },
      planning_completed: { label: "Planejamento OK", icon: CheckCircle2 },
      pending_pm_final: { label: "Aguardando PM Final", icon: Clock },
      completed: { label: "Concluído", icon: CheckCircle2 },
    };

    const workflow = workflowLabels[workflowStatus] || { label: "Pendente", icon: AlertCircle };
    const Icon = workflow.icon;

    return (
      <Badge variant="secondary">
        <Icon className="h-3 w-3 mr-1" />
        {workflow.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Revisões de Contrato</h3>
            <p className="text-sm text-muted-foreground">
              Solicitações de mudança criadas após assinatura do contrato
            </p>
          </div>
          <Button onClick={() => setRevisionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Revisão
          </Button>
        </div>

        {!revisions || revisions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileEdit className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma revisão solicitada</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Revisões de contrato são mudanças solicitadas após a assinatura.
                Elas passam por aprovação antes de poderem ser convertidas em ATOs.
              </p>
              <Button onClick={() => setRevisionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Solicitar Primeira Revisão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {revisions.map((revision) => (
              <Card key={revision.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{revision.item_name}</CardTitle>
                      <CardDescription>
                        Criado em {new Date(revision.created_at).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </div>
                    {getStatusBadge(revision.status, revision.workflow_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {revision.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Descrição:</h4>
                      <p className="text-sm text-muted-foreground">{revision.notes}</p>
                    </div>
                  )}

                  {revision.pm_scope && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Escopo PM:</h4>
                      <p className="text-sm text-muted-foreground">{revision.pm_scope}</p>
                    </div>
                  )}

                  {revision.status === "approved" && (
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Custo: </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(revision.additional_cost || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prazo: </span>
                        <span className="font-semibold text-orange-600">
                          +{revision.delivery_impact_days || 0} dias
                        </span>
                      </div>
                    </div>
                  )}

                  {revision.reject_reason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-destructive mb-1">
                        Motivo da Rejeição:
                      </h4>
                      <p className="text-sm text-muted-foreground">{revision.reject_reason}</p>
                    </div>
                  )}

                  {revision.status === "approved" && !revision.ato_id && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        ✓ Esta revisão está aprovada e disponível para conversão em ATO na aba "Visão Geral"
                      </p>
                    </div>
                  )}

                  {revision.ato_id && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm text-green-900 dark:text-green-100">
                        ✓ Convertida em ATO
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <RequestContractRevisionDialog
        open={revisionDialogOpen}
        onOpenChange={setRevisionDialogOpen}
        contractId={contractId}
        quotationId={quotationId}
      />
    </>
  );
}
