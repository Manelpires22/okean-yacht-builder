import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SimplifiedTechnicalApprovalDialog } from "@/components/approvals/SimplifiedTechnicalApprovalDialog";
import { CustomizationWorkflowModal } from "@/components/configurator/CustomizationWorkflowModal";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type TabValue = 'pending' | 'approved' | 'rejected' | 'all';

interface CustomizationWithDetails {
  id: string;
  item_name: string;
  customization_code: string | null;
  workflow_status: string | null;
  engineering_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  quotation: {
    quotation_number: string;
    client_name: string;
    yacht_model_id: string;
    yacht_models: {
      name: string;
      pm_assignments: {
        pm_user: {
          full_name: string;
        };
      }[] | null;
    } | null;
    sales_representative: {
      full_name: string;
    } | null;
  } | null;
}

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [selectedCustomization, setSelectedCustomization] = useState<CustomizationWithDetails | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);

  // Buscar customizações no workflow simplificado
  const { data: customizations = [], isLoading } = useQuery({
    queryKey: ['workflow-customizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotation_customizations')
        .select(`
          id,
          item_name,
          customization_code,
          workflow_status,
          engineering_notes,
          reviewed_by,
          reviewed_at,
          created_at,
          quotation:quotations!inner (
            quotation_number,
            client_name,
            yacht_model_id,
            yacht_models (
              name,
              pm_assignments:pm_yacht_model_assignments (
                pm_user:users!pm_yacht_model_assignments_pm_user_id_fkey (
                  full_name
                )
              )
            ),
            sales_representative:users!quotations_sales_representative_id_fkey (
              full_name
            )
          )
        `)
        .not('workflow_status', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as CustomizationWithDetails[];
    },
  });

  // Filtrar por status
  const pendingCustomizations = customizations.filter(c => 
    c.workflow_status?.includes('pending')
  );
  const approvedCustomizations = customizations.filter(c => 
    c.workflow_status?.includes('approved')
  );
  const rejectedCustomizations = customizations.filter(c => 
    c.workflow_status === 'rejected'
  );

  const getDisplayedCustomizations = () => {
    switch (activeTab) {
      case 'pending':
        return pendingCustomizations;
      case 'approved':
        return approvedCustomizations;
      case 'rejected':
        return rejectedCustomizations;
      default:
        return customizations;
    }
  };

  const handleViewDetails = (customization: CustomizationWithDetails) => {
    setSelectedCustomization(customization);
    setApprovalDialogOpen(true);
  };

  const handleViewWorkflow = (customization: CustomizationWithDetails) => {
    setSelectedCustomization(customization);
    setWorkflowDialogOpen(true);
  };

  const getStatusBadge = (workflowStatus: string) => {
    const statusMap = {
      pending_pm_review: { variant: "secondary" as const, label: "Pendente PM" },
      pending_commercial: { variant: "secondary" as const, label: "Pendente Comercial" },
      pending_technical: { variant: "secondary" as const, label: "Pendente Técnico" },
      approved_commercial: { variant: "default" as const, label: "Aprovado Comercial" },
      approved_technical: { variant: "default" as const, label: "Aprovado Técnico" },
      rejected: { variant: "destructive" as const, label: "Rejeitado" },
    };
    return statusMap[workflowStatus as keyof typeof statusMap] || { 
      variant: "secondary" as const, 
      label: workflowStatus 
    };
  };

  const getPMName = (customization: CustomizationWithDetails) => {
    const pmAssignments = customization.quotation?.yacht_models?.pm_assignments;
    if (pmAssignments && pmAssignments.length > 0) {
      return pmAssignments[0].pm_user.full_name;
    }
    return 'PM não atribuído';
  };

  const displayed = getDisplayedCustomizations();

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Aprovações (Workflow Simplificado)</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie customizações e aprovações pelo novo workflow
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCustomizations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCustomizations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCustomizations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customizations.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes {pendingCustomizations.length > 0 && `(${pendingCustomizations.length})`}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovadas {approvedCustomizations.length > 0 && `(${approvedCustomizations.length})`}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejeitadas {rejectedCustomizations.length > 0 && `(${rejectedCustomizations.length})`}
            </TabsTrigger>
            <TabsTrigger value="all">
              Todas {customizations.length > 0 && `(${customizations.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 md:mt-6">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-sm text-muted-foreground">
                Nenhuma customização encontrada
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-[1000px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cotação</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>PM Responsável</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayed.map((customization) => {
                        const statusBadge = getStatusBadge(customization.workflow_status || 'pending');
                        return (
                          <TableRow key={customization.id}>
                            <TableCell className="font-medium">
                              {customization.quotation?.quotation_number}
                            </TableCell>
                            <TableCell>{customization.quotation?.client_name}</TableCell>
                            <TableCell>
                              {customization.quotation?.sales_representative?.full_name || '-'}
                            </TableCell>
                            <TableCell>{customization.item_name}</TableCell>
                            <TableCell>
                              {customization.customization_code ? (
                                <span className="font-mono text-xs">{customization.customization_code}</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-sm">{getPMName(customization)}</p>
                                <Badge variant="outline" className="text-xs">
                                  PM Engenharia
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(customization.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(customization)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Detalhes
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewWorkflow(customization)}
                                >
                                  <Workflow className="h-4 w-4 mr-2" />
                                  Workflow
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Simplified Technical Approval Dialog */}
        {selectedCustomization && (
          <SimplifiedTechnicalApprovalDialog
            open={approvalDialogOpen}
            onOpenChange={setApprovalDialogOpen}
            approval={{
              id: selectedCustomization.id,
              quotation_id: '', // não usado no componente simplificado
              approval_type: 'technical',
              status: selectedCustomization.workflow_status?.includes('approved') ? 'approved' : 
                      selectedCustomization.workflow_status === 'rejected' ? 'rejected' : 'pending',
              notes: selectedCustomization.engineering_notes,
              request_details: {
                customization_id: selectedCustomization.id,
                customization_code: selectedCustomization.customization_code,
                item_name: selectedCustomization.item_name,
              },
              quotations: selectedCustomization.quotation as any,
            } as any}
          />
        )}

        {/* Customization Workflow Modal */}
        {selectedCustomization && (
          <CustomizationWorkflowModal
            customizationId={selectedCustomization.id}
            open={workflowDialogOpen}
            onOpenChange={setWorkflowDialogOpen}
          />
        )}
      </div>
    </AdminLayout>
  );
}
