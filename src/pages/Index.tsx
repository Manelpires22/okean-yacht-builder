import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Package, CheckCircle } from "lucide-react";
import { useStats } from "@/hooks/useStats";
import { useContractStats } from "@/hooks/useContractStats";
import { useWorkflowPendingCount } from "@/hooks/useWorkflowPendingCount";
import { useQuotations } from "@/hooks/useQuotations";
import { Skeleton } from "@/components/ui/skeleton";
import { MainLayout } from "@/components/MainLayout";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: contractStats, isLoading: contractsLoading } = useContractStats();
  const { data: pendingCount, isLoading: pendingLoading } = useWorkflowPendingCount();
  const { data: quotations, isLoading: quotationsLoading } = useQuotations();

  const latestQuotations = quotations?.slice(0, 5) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      sent: "default",
      accepted: "default",
      rejected: "destructive",
      expired: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Operacional</h1>
          <p className="text-muted-foreground">
            Visão geral das operações do sistema OKEAN Yachts CPQ
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cotações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.quotationsCount || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Cotações registradas no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{contractStats?.activeContracts || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Contratos em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{pendingCount || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Workflows aguardando ação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Últimas Cotações */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Cotações</CardTitle>
          </CardHeader>
          <CardContent>
            {quotationsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : latestQuotations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma cotação encontrada
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestQuotations.map((quotation: any) => (
                    <TableRow
                      key={quotation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/cotacoes/${quotation.id}`)}
                    >
                      <TableCell className="font-medium">
                        {quotation.quotation_number}
                      </TableCell>
                      <TableCell>{quotation.client_name}</TableCell>
                      <TableCell>{quotation.yacht_models?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(quotation.final_price)}
                      </TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell>
                        {format(new Date(quotation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
