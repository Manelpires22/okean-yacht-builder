import { useState } from "react";
import { useApprovals } from "@/hooks/useApprovals";
import { ApprovalStats } from "@/components/approvals/ApprovalStats";
import { ApprovalDialog } from "@/components/approvals/ApprovalDialog";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TabValue = 'all' | 'pending' | 'approved' | 'rejected';

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: allApprovals = [] } = useApprovals();
  const { data: pendingApprovals = [] } = useApprovals({ status: 'pending' });
  const { data: approvedApprovals = [] } = useApprovals({ status: 'approved' });
  const { data: rejectedApprovals = [] } = useApprovals({ status: 'rejected' });

  const getDisplayedApprovals = () => {
    switch (activeTab) {
      case 'pending':
        return pendingApprovals;
      case 'approved':
        return approvedApprovals;
      case 'rejected':
        return rejectedApprovals;
      default:
        return allApprovals;
    }
  };

  const handleViewDetails = (id: string) => {
    setSelectedApprovalId(id);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pendente" },
      approved: { variant: "default" as const, label: "Aprovada" },
      rejected: { variant: "destructive" as const, label: "Rejeitada" }
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'commercial') return 'Desconto';
    if (type === 'technical') return 'Customização';
    return type === 'discount' ? 'Desconto' : 'Customização';
  };

  const displayedApprovals = getDisplayedApprovals();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Aprovações</h1>
          <p className="text-muted-foreground">
            Gerencie solicitações de aprovação de descontos e customizações
          </p>
        </div>

        <ApprovalStats
          totalPending={pendingApprovals.length}
          totalApproved={approvedApprovals.length}
          totalRejected={rejectedApprovals.length}
          totalAll={allApprovals.length}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes {pendingApprovals.length > 0 && `(${pendingApprovals.length})`}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovadas {approvedApprovals.length > 0 && `(${approvedApprovals.length})`}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejeitadas {rejectedApprovals.length > 0 && `(${rejectedApprovals.length})`}
            </TabsTrigger>
            <TabsTrigger value="all">
              Todas {allApprovals.length > 0 && `(${allApprovals.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {displayedApprovals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma solicitação encontrada
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cotação</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedApprovals.map((approval) => {
                      const statusBadge = getStatusBadge(approval.status);
                      return (
                        <TableRow key={approval.id}>
                          <TableCell className="font-medium">
                            {approval.quotations?.quotation_number}
                          </TableCell>
                          <TableCell>{approval.quotations?.client_name}</TableCell>
                          <TableCell>
                            {approval.quotations?.sales_representative?.full_name || '-'}
                          </TableCell>
                          <TableCell>
                            {approval.approval_type === 'commercial' && approval.request_details?.discount_type && (
                              <Badge variant="outline">
                                {approval.request_details.discount_type === 'base' ? 'Desconto Base' : 'Desconto Opcionais'}
                              </Badge>
                            )}
                            {approval.approval_type === 'technical' && approval.request_details?.customization_item_name && (
                              <Badge variant="outline">
                                Customização: {approval.request_details.customization_item_name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {approval.approval_type === 'commercial' && approval.request_details && (
                              <div className="text-destructive font-medium">
                                {approval.request_details.discount_percentage}%
                                <span className="text-xs text-muted-foreground ml-1">
                                  (-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(approval.request_details.discount_amount)})
                                </span>
                              </div>
                            )}
                            {approval.approval_type === 'technical' && approval.request_details && (
                              <div className="text-sm">
                                <p className="font-medium">{approval.request_details.customization_item_name}</p>
                                {approval.request_details.quantity > 1 && (
                                  <span className="text-muted-foreground text-xs">Qtd: {approval.request_details.quantity}</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(approval.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(approval.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ApprovalDialog
          approvalId={selectedApprovalId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </AdminLayout>
  );
}
