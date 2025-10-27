import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotations, useDuplicateQuotation, useDeleteQuotation } from "@/hooks/useQuotations";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { QuotationStatusBadge } from "@/components/quotations/QuotationStatusBadge";
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
import { Search, Eye, Copy, FileText, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


export default function Quotations() {
  const navigate = useNavigate();
  const { data: quotations, isLoading } = useQuotations();
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
    if (!quotations) return [];
    return quotations.filter((q) => {
      const matchesSearch =
        q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.clients?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

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
    <>
      <AppHeader title="Cotações" />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Gerencie as cotações de iates personalizados
          </p>
          <Button onClick={() => navigate("/configurator")}>
            <FileText className="mr-2 h-4 w-4" />
            Nova Cotação
          </Button>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
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
              <SelectTrigger className="w-[280px]">
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
                filteredQuotations?.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">
                      {quotation.quotation_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {quotation.clients?.name || quotation.client_name}
                        </div>
                        {quotation.clients?.company && (
                          <div className="text-sm text-muted-foreground">
                            {quotation.clients.company}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {quotation.yacht_models?.name || "N/A"}
                    </TableCell>
                    <TableCell>{formatCurrency(quotation.final_price)}</TableCell>
                    <TableCell>
                      <QuotationStatusBadge status={quotation.status as any} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(quotation.valid_until), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {format(new Date(quotation.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/quotations/${quotation.id}`)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {canEditQuotation(quotation) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/configurator?edit=${quotation.id}`)}
                            title="Editar cotação"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {canDeleteQuotation(quotation) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Deletar cotação"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja deletar a cotação {quotation.quotation_number}?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteQuotation.mutate(quotation.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(quotation.id)}
                          disabled={duplicateQuotation.isPending}
                          title="Duplicar cotação"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
