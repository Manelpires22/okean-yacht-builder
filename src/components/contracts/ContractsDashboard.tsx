import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useContractStats } from "@/hooks/useContractStats";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Activity, 
  DollarSign, 
  TrendingUp,
  Clock,
  FileSignature
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Progress } from "@/components/ui/progress";

export function ContractsDashboard() {
  const { data: stats, isLoading } = useContractStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const activePercentage = stats.totalContracts > 0 
    ? (stats.activeContracts / stats.totalContracts) * 100 
    : 0;

  const atoApprovalRate = stats.totalATOs > 0
    ? (stats.approvedATOs / stats.totalATOs) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContracts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeContracts} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {formatCurrency(stats.averageContractValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ATOs Totais</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalATOs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingATOs} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prazo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageDeliveryDays)}</div>
            <p className="text-xs text-muted-foreground mt-1">dias de entrega</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status dos Contratos</CardTitle>
            <CardDescription>Distribuição por estado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span>Ativos</span>
                </div>
                <span className="font-medium">{stats.activeContracts}</span>
              </div>
              <Progress value={activePercentage} className="h-2" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Concluídos</span>
              </div>
              <span className="font-medium">{stats.completedContracts}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Cancelados</span>
              </div>
              <span className="font-medium">{stats.cancelledContracts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receita de ATOs</CardTitle>
            <CardDescription>Adicional aos contratos base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {formatCurrency(stats.totalATORevenue)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Aprovadas</span>
                <span className="font-medium text-green-600">{stats.approvedATOs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rejeitadas</span>
                <span className="font-medium text-destructive">{stats.rejectedATOs}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <CardDescription>ATOs aprovadas vs total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {atoApprovalRate.toFixed(1)}%
            </div>
            <Progress value={atoApprovalRate} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {stats.approvedATOs} de {stats.totalATOs} ATOs aprovadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Composição da Receita</CardTitle>
          <CardDescription>Contratos base vs ATOs adicionais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Contratos Base</span>
                <span className="text-sm font-bold">
                  {formatCurrency(stats.totalRevenue - stats.totalATORevenue)}
                </span>
              </div>
              <Progress 
                value={stats.totalRevenue > 0 ? ((stats.totalRevenue - stats.totalATORevenue) / stats.totalRevenue) * 100 : 0} 
                className="h-2" 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">ATOs Adicionais</span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(stats.totalATORevenue)}
                </span>
              </div>
              <Progress 
                value={stats.totalRevenue > 0 ? (stats.totalATORevenue / stats.totalRevenue) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
