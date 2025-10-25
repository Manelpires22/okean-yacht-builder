import { useState, useMemo } from "react";
import { useApprovals } from "@/hooks/useApprovals";
import { ApprovalStats } from "@/components/approvals/ApprovalStats";
import { ApprovalDialog } from "@/components/approvals/ApprovalDialog";
import { CustomizationWorkflowModal } from "@/components/configurator/CustomizationWorkflowModal";
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
import { Eye, Workflow } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TabValue = 'all' | 'pending' | 'approved' | 'rejected';

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [selectedCustomizationId, setSelectedCustomizationId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);

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

  const handleViewWorkflow = (customizationId: string) => {
    setSelectedCustomizationId(customizationId);
    setWorkflowDialogOpen(true);
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

  // Determinar aprovador baseado no tipo e dados da aprovação
  const getApproverInfo = (approval: any) => {
    if (approval.approval_type === 'technical' || approval.approval_type === 'customization') {
      // Para customizações técnicas, buscar PM do modelo
      const yachtModel = approval.quotations?.yacht_models;
      
      if (!yachtModel) {
        return {
          name: 'PM não atribuído',
          role: 'PM Engenharia'
        };
      }

      // pm_assignments pode ser um array ou objeto único dependendo da query
      const pmAssignments = Array.isArray(yachtModel.pm_assignments) 
        ? yachtModel.pm_assignments 
        : yachtModel.pm_assignments 
          ? [yachtModel.pm_assignments]
          : [];

      if (pmAssignments.length > 0) {
        const pmUser = pmAssignments[0].pm_user;
        if (pmUser && pmUser.full_name) {
          return {
            name: pmUser.full_name,
            role: 'PM Engenharia'
          };
        }
      }

      return {
        name: 'PM não atribuído',
        role: 'PM Engenharia'
      };
    }

    // Para descontos comerciais, determinar baseado no percentual
    if (approval.approval_type === 'commercial' || approval.approval_type === 'discount') {
      const discountPercentage = approval.request_details?.discount_percentage || 0;
      
      // Limites configuráveis (devem vir de discount_limits_config idealmente)
      // Mas por ora usamos valores padrão que correspondem ao sistema atual
      if (discountPercentage > 15) {
        return {
          name: 'Administrador',
          role: 'Administrador'
        };
      }
      return {
        name: 'Diretor Comercial',
        role: 'Diretor Comercial'
      };
    }

    return {
      name: '-',
      role: '-'
    };
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
                      <TableHead>Aprovador</TableHead>
                      <TableHead>Status Workflow</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedApprovals.map((approval) => {
                      const statusBadge = getStatusBadge(approval.status);
                      const approverInfo = getApproverInfo(approval);
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
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{approverInfo.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {approverInfo.role}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(approval.approval_type === 'technical' || approval.approval_type === 'customization') && 
                             approval.request_details?.customization_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewWorkflow(approval.request_details.customization_id)}
                              >
                                <Workflow className="h-4 w-4 mr-2" />
                                Ver Workflow
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(approval.requested_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(approval.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Detalhes
                              </Button>
                              {(approval.approval_type === 'technical' || approval.approval_type === 'customization') && 
                               approval.request_details?.customization_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewWorkflow(approval.request_details.customization_id)}
                                >
                                  <Workflow className="h-4 w-4 mr-2" />
                                  Workflow
                                </Button>
                              )}
                            </div>
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

        <CustomizationWorkflowModal
          customizationId={selectedCustomizationId}
          open={workflowDialogOpen}
          onOpenChange={setWorkflowDialogOpen}
        />
      </div>
    </AdminLayout>
  );
}
