import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Package, CalendarCheck, Send, CheckCircle2 } from "lucide-react";

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

  // Contar ATOs por status de workflow
  const pendingPMReview = atos.filter(
    ato => ato.workflow_status === 'pending_pm_review'
  ).length;

  const pendingSupplyQuote = atos.filter(
    ato => ato.workflow_status === 'pending_supply_quote'
  ).length;

  const pendingPlanningValidation = atos.filter(
    ato => ato.workflow_status === 'pending_planning_validation'
  ).length;

  const pendingPMFinal = atos.filter(
    ato => ato.workflow_status === 'pending_pm_final'
  ).length;

  const workflowCompleted = atos.filter(
    ato => ato.workflow_status === 'completed'
  ).length;

  const readyToSend = atos.filter(
    ato => ato.workflow_status === 'completed' && ato.status === 'draft'
  ).length;

  const sentToClient = atos.filter(
    ato => ato.status === 'pending_approval'
  ).length;

  const approved = atos.filter(
    ato => ato.status === 'approved'
  ).length;

  const rejected = atos.filter(
    ato => ato.status === 'rejected'
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Em Revisão PM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Revisão PM
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPMReview}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando escopo PM
          </p>
          {pendingPMReview > 0 && (
            <Badge variant="outline" className="mt-2 text-orange-600 border-orange-300 dark:border-orange-700">
              Requer ação
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Em Cotação Supply */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cotação Supply
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingSupplyQuote}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando cotação
          </p>
          {pendingSupplyQuote > 0 && (
            <Badge variant="outline" className="mt-2 text-blue-600 border-blue-300 dark:border-blue-700">
              Requer ação
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Em Validação Planning */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Validação Planning
          </CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPlanningValidation}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando prazo
          </p>
          {pendingPlanningValidation > 0 && (
            <Badge variant="outline" className="mt-2 text-purple-600 border-purple-300 dark:border-purple-700">
              Requer ação
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Consolidação Final PM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Consolidação Final
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPMFinal}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando PM final
          </p>
          {pendingPMFinal > 0 && (
            <Badge variant="outline" className="mt-2 text-indigo-600 border-indigo-300 dark:border-indigo-700">
              Requer ação
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Prontas para Envio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Prontas p/ Envio
          </CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{readyToSend}</div>
          <p className="text-xs text-muted-foreground">
            Workflow completo
          </p>
          {readyToSend > 0 && (
            <Badge variant="outline" className="mt-2 text-green-600 border-green-300 dark:border-green-700">
              Enviar ao cliente
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Enviadas ao Cliente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Aguardando Cliente
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sentToClient}</div>
          <p className="text-xs text-muted-foreground">
            Enviadas para aprovação
          </p>
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
          <CheckCircle2 className="h-4 w-4 text-destructive" />
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
