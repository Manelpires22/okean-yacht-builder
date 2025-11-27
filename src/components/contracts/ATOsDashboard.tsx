import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, DollarSign, Send, CheckCircle2, XCircle } from "lucide-react";

interface ATOsDashboardProps {
  atos: any[];
  isLoading?: boolean;
}

export function ATOsDashboard({ atos, isLoading }: ATOsDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Contar ATOs por status de workflow e status
  const pendingPMReview = atos.filter(
    ato => ato.workflow_status === 'pending_pm_review'
  ).length;

  const pendingCommercialApproval = atos.filter(
    ato => ato.workflow_status === 'completed' && ato.commercial_approval_status === 'pending'
  ).length;

  const pendingCommercialValidation = atos.filter(
    ato => ato.workflow_status === 'completed' && ato.status === 'draft'
  ).length;

  const pendingClientApproval = atos.filter(
    ato => ato.status === 'pending_approval' && ato.workflow_status === 'completed'
  ).length;

  const approved = atos.filter(
    ato => ato.status === 'approved'
  ).length;

  const rejected = atos.filter(
    ato => ato.status === 'rejected'
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-6">
      {/* Análise PM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Análise PM
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPMReview}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando escopo técnico
          </p>
          {pendingPMReview > 0 && (
            <Badge variant="outline" className="mt-2 text-orange-600 border-orange-300 dark:border-orange-700">
              Requer ação
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Validação Comercial */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Validação Comercial
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{pendingCommercialValidation}</div>
          <p className="text-xs text-muted-foreground">
            PM concluído, aguardando vendedor
          </p>
          {pendingCommercialValidation > 0 && (
            <Badge variant="outline" className="mt-2 text-blue-600 border-blue-300 dark:border-blue-700">
              Requer validação
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Aguardando Cliente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Aguardando Cliente
          </CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingClientApproval}</div>
          <p className="text-xs text-muted-foreground">
            Enviadas para aprovação
          </p>
          {pendingClientApproval > 0 && (
            <Badge variant="outline" className="mt-2 text-purple-600 border-purple-300 dark:border-purple-700">
              Aguardando resposta
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Aprovadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Aprovadas
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{approved}</div>
          <p className="text-xs text-muted-foreground">
            Aceitas pelo cliente
          </p>
        </CardContent>
      </Card>

      {/* Rejeitadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rejeitadas
          </CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{rejected}</div>
          <p className="text-xs text-muted-foreground">
            Recusadas pelo cliente
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
