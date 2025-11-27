import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDuplicateQuotation, useDeleteQuotation } from "@/hooks/useQuotations";
import { useQuotationsGroupedByVersion } from "@/hooks/useQuotationsGroupedByVersion";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { QuotationVersionRow } from "@/components/quotations/QuotationVersionRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText } from "lucide-react";


export default function Quotations() {
  const navigate = useNavigate();
  const { data: groupedQuotations, isLoading } = useQuotationsGroupedByVersion();
  const duplicateQuotation = useDuplicateQuotation();
  const deleteQuotation = useDeleteQuotation();
  const { data: userRoles } = useUserRole();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusOptions = [
    { value: "all", label: "Todos os Status" },
    { value: "draft", label: "Rascunho" },
    { value: "pending_commercial_approval", label: "Aguardando Aprovação Comercial" },
    { value: "pending_technical_approval", label: "Aguardando Validação Técnica" },
    { value: "ready_to_send", label: "Pronta para Envio" },
    { value: "sent", label: "Enviada" },
    { value: "approved", label: "Aprovada Internamente" },
    { value: "accepted", label: "Aceita" },
    { value: "rejected", label: "Rejeitada" },
    { value: "expired", label: "Expirada" },
  ];

  const isAdmin = userRoles?.roles?.includes('administrador');

  const canEditQuotation = (quotation: any) => {
    if (isAdmin) return true;
    return quotation.sales_representative_id === user?.id && quotation.status === 'draft';
  };

  const canDeleteQuotation = (quotation: any) => {
    if (isAdmin) return true;
    return quotation.sales_representative_id === user?.id && quotation.status === 'draft';
  };

  const filteredQuotations = useMemo(() => {
    if (!groupedQuotations) return [];
    return groupedQuotations.filter((group) => {
      const q = group.latestVersion;
      const matchesSearch =
        q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.clients?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [groupedQuotations, searchTerm, statusFilter]);

  const handleDuplicate = (id: string) => {
    duplicateQuotation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando cotações...</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cotações</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as cotações de iates personalizados
            </p>
          </div>
          <Button onClick={() => navigate("/configurator")} className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            Nova Cotação
          </Button>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Modelo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Validade</TableHead>
                  <TableHead className="hidden xl:table-cell">Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredQuotations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Nenhuma cotação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotations?.map((group) => (
                  <QuotationVersionRow
                    key={group.rootId}
                    latestVersion={group.latestVersion}
                    previousVersions={group.previousVersions}
                    totalVersions={group.totalVersions}
                    hasMultipleVersions={group.hasMultipleVersions}
                    hasContract={group.hasContract}
                    contractNumber={group.contractNumber}
                    onNavigate={(id) => navigate(`/quotations/${id}`)}
                    onEdit={(id) => navigate(`/configurator?edit=${id}`)}
                    onDelete={(id) => deleteQuotation.mutate(id)}
                    onDuplicate={(id) => handleDuplicate(id)}
                    canEdit={canEditQuotation(group.latestVersion)}
                    canDelete={canDeleteQuotation(group.latestVersion)}
                  />
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
