import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuditLogs, useAuditLogStats, exportAuditLogsToCSV, type AuditLog } from "@/hooks/useAuditLogs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Eye, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const actionColors: Record<string, string> = {
  INSERT: "bg-green-500/10 text-green-500 border-green-500/20",
  UPDATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  LOGIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  LOGOUT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  CUSTOM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const actionLabels: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  LOGIN: "Login",
  LOGOUT: "Logout",
  CUSTOM: "Personalizado",
};

const tableLabels: Record<string, string> = {
  quotations: "Cotações",
  users: "Usuários",
  user_roles: "Roles de Usuários",
  options: "Opcionais",
  yacht_models: "Modelos de Iates",
  clients: "Clientes",
  approvals: "Aprovações",
  quotation_customizations: "Customizações",
  discount_limits_config: "Limites de Desconto",
  memorial_items: "Itens Memorial",
  memorial_categories: "Categorias Memorial",
};

export default function AdminAuditLogs() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: "all",
    tableName: "all",
    searchEmail: "",
    page: 1,
  });

  const { data: stats, isLoading: statsLoading } = useAuditLogStats();
  const { data, isLoading } = useAuditLogs({
    action: filters.action && filters.action !== 'all' ? filters.action : undefined,
    tableName: filters.tableName && filters.tableName !== 'all' ? filters.tableName : undefined,
    page: filters.page,
    pageSize: 50,
  });

  const handleExport = () => {
    if (data?.logs) {
      exportAuditLogsToCSV(data.logs);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const filteredLogs = data?.logs.filter(log => {
    if (filters.searchEmail && log.user_email) {
      return log.user_email.toLowerCase().includes(filters.searchEmail.toLowerCase());
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Logs de Auditoria</h1>
          <p className="text-muted-foreground mt-2">
            Histórico completo de ações no sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Logs</CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? <Skeleton className="h-8 w-20" /> : stats?.totalLogs || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Logs Hoje</CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? <Skeleton className="h-8 w-20" /> : stats?.todayLogs || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ações Mais Comuns</CardDescription>
              <CardTitle className="text-lg">
                {statsLoading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(stats?.actionBreakdown || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([action, count]) => (
                        <Badge key={action} variant="secondary" className="text-xs">
                          {actionLabels[action]}: {count}
                        </Badge>
                      ))}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ação</label>
                <Select
                  value={filters.action}
                  onValueChange={(value) =>
                    setFilters({ ...filters, action: value, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="INSERT">Criação</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tabela</label>
                <Select
                  value={filters.tableName}
                  onValueChange={(value) =>
                    setFilters({ ...filters, tableName: value, page: 1 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as tabelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(tableLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email do Usuário</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por email..."
                    value={filters.searchEmail}
                    onChange={(e) =>
                      setFilters({ ...filters, searchEmail: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button onClick={handleExport} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Auditoria</CardTitle>
            <CardDescription>
              {data?.total || 0} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Tabela</TableHead>
                        <TableHead>Detalhes</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Nenhum log encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs?.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">
                              {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {log.user_name || "Sistema"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {log.user_email || "-"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={actionColors[log.action]}
                              >
                                {actionLabels[log.action]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {log.table_name
                                  ? tableLabels[log.table_name] || log.table_name
                                  : "-"}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {log.changed_fields?.length
                                ? `${log.changed_fields.length} campos alterados`
                                : log.action === "INSERT"
                                ? "Novo registro"
                                : log.action === "DELETE"
                                ? "Registro excluído"
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {data.page} de {data.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilters({ ...filters, page: filters.page - 1 })
                        }
                        disabled={data.page === 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilters({ ...filters, page: filters.page + 1 })
                        }
                        disabled={data.page === data.totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              Informações completas sobre a ação realizada
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                  <p className="text-sm">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuário</p>
                  <p className="text-sm">{selectedLog.user_name || "Sistema"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLog.user_email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ação</p>
                  <Badge className={actionColors[selectedLog.action]}>
                    {actionLabels[selectedLog.action]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tabela</p>
                  <p className="text-sm">
                    {selectedLog.table_name
                      ? tableLabels[selectedLog.table_name] || selectedLog.table_name
                      : "-"}
                  </p>
                </div>
              </div>

              {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Campos Alterados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.changed_fields.map((field) => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.old_values && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Valores Antigos
                  </p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Valores Novos
                  </p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
