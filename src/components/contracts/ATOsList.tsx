import { useState } from "react";
import { useATOs, useReopenATOForCommercialReview } from "@/hooks/useATOs";
import { useSendATO } from "@/hooks/useSendATO";
import { useATOWorkflowTasks } from "@/hooks/useATOWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, FileText, DollarSign, Calendar, ChevronRight, Package, Send, AlertCircle, Wrench } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { getATOStatusLabel, getATOStatusColor } from "@/lib/contract-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateATODialog } from "./CreateATODialog";
import { ATODetailDialog } from "./ATODetailDialog";
import { ATOWorkflowTimeline } from "./ATOWorkflowTimeline";
import { ATOsDashboard } from "./ATOsDashboard";
import { SendATOToClientDialog, SendATOData } from "./SendATOToClientDialog";
import { ATOCommercialReviewDialog } from "./ATOCommercialReviewDialog";
import { useATOWorkflow } from "@/hooks/useATOWorkflow";

interface ATOsListProps {
  contractId: string;
}

export function ATOsList({ contractId }: ATOsListProps) {
  const { user } = useAuth();
  const { data: userRoleData } = useUserRole();
  const isAdmin = userRoleData?.roles?.includes('administrador');
  const { data: atos, isLoading } = useATOs(contractId);
  const { data: userTasks } = useATOWorkflowTasks(user?.id, isAdmin);
  const { mutateAsync: sendATO } = useSendATO();
  const { mutateAsync: reopenATO } = useReopenATOForCommercialReview();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedATO, setSelectedATO] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<string | undefined>(undefined);
  const [sendATODialog, setSendATODialog] = useState<{
    open: boolean;
    ato?: any;
  }>({ open: false });
  const [commercialReviewDialog, setCommercialReviewDialog] = useState<{
    open: boolean;
    ato?: any;
  }>({ open: false });
  const [pendingDiscount, setPendingDiscount] = useState(0);
  const [filterTab, setFilterTab] = useState<string>("workflow");

  // Buscar dados do workflow quando abrindo revisão comercial
  const { data: workflowData } = useATOWorkflow(commercialReviewDialog.ato?.id);

  const handleCommercialReview = (discountPercentage: number) => {
    setPendingDiscount(discountPercentage);
    setCommercialReviewDialog({ open: false });
    setSendATODialog({ open: true, ato: commercialReviewDialog.ato });
  };

  const handleSendATO = async (data: SendATOData) => {
    if (!sendATODialog.ato) return;
    
    await sendATO({
      atoId: sendATODialog.ato.id,
      discountPercentage: pendingDiscount,
      ...data
    });
    
    setPendingDiscount(0);
  };

  // Filtrar ATOs baseado na tab selecionada
  const filteredATOs = atos?.filter((ato) => {
    if (filterTab === "all") return true;
    if (filterTab === "pending") return ato.status === 'draft' && !ato.workflow_status;
    if (filterTab === "workflow") {
      return ato.workflow_status && 
             ato.workflow_status !== 'completed' && 
             !['rejected', 'cancelled'].includes(ato.status);
    }
    if (filterTab === "sent") return ato.status === 'pending_approval';
    if (filterTab === "finished") {
      return ['approved', 'rejected', 'cancelled'].includes(ato.status) ||
             (ato.workflow_status === 'completed' && ato.status === 'draft');
    }
    return true;
  }) || [];

  // ATOs deste contrato que o usuário precisa revisar
  const userPendingATOs = userTasks?.filter(task => 
    atos?.some(ato => ato.id === task.ato_id)
  ) || [];

  const openATOForReview = (atoId: string) => {
    setSelectedATO(atoId);
    setDetailsTab("workflow");
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard com Métricas */}
      <ATOsDashboard atos={atos || []} isLoading={isLoading} />

      {/* Card de Pendências do Usuário */}
      {userPendingATOs.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 dark:text-orange-200">
            {isAdmin 
              ? `${userPendingATOs.length} ${userPendingATOs.length === 1 ? 'ATO pendente' : 'ATOs pendentes'} de revisão`
              : `Você tem ${userPendingATOs.length} ${userPendingATOs.length === 1 ? 'ATO aguardando' : 'ATOs aguardando'} sua revisão`
            }
          </AlertTitle>
          <AlertDescription className="mt-3 space-y-2">
            {userPendingATOs.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                <div className="flex items-center gap-2 flex-1">
                  <Wrench className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">
                    {task.ato?.ato_number} - {task.ato?.title}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {task.step_type === 'pm_review' && 'Revisão PM'}
                    {task.step_type === 'commercial_approval' && 'Validação Comercial'}
                  </Badge>
                  {isAdmin && task.assigned_to !== user?.id && task.assigned_user && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      👤 {task.assigned_user.full_name}
                    </Badge>
                  )}
                </div>
                <Button 
                  size="sm" 
                  onClick={() => openATOForReview(task.ato_id)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Revisar Agora
                </Button>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ATOs (Additional To Order)</CardTitle>
              <CardDescription>
                Aditivos ao contrato original - todas as mudanças pós-contrato
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova ATO
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!atos || atos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma ATO criada</h3>
              <p className="text-muted-foreground mb-4">
                ATOs são aditivos ao contrato para modificações, customizações ou configurações extras
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira ATO
              </Button>
            </div>
          ) : (
            <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">
                  Todas ({atos.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendentes ({atos.filter(a => a.status === 'draft' && !a.workflow_status).length})
                </TabsTrigger>
                <TabsTrigger value="workflow">
                  Em Workflow ({atos.filter(a => 
                    a.workflow_status && 
                    a.workflow_status !== 'completed' && 
                    !['rejected', 'cancelled'].includes(a.status)
                  ).length})
                </TabsTrigger>
                <TabsTrigger value="sent">
                  Enviadas ({atos.filter(a => a.status === 'pending_approval').length})
                </TabsTrigger>
                <TabsTrigger value="finished">
                  Finalizadas ({atos.filter(a => 
                    ['approved', 'rejected', 'cancelled'].includes(a.status) ||
                    (a.workflow_status === 'completed' && a.status === 'draft')
                  ).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={filterTab} className="mt-6">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título & Workflow</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Impacto Preço</TableHead>
                  <TableHead>Impacto Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredATOs.map((ato) => (
                  <TableRow key={ato.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{ato.ato_number}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">{ato.title}</p>
                          {ato.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {ato.description}
                            </p>
                          )}
                        </div>
                        {ato.workflow_status && (
                          <div className="pt-2">
                            <ATOWorkflowTimeline 
                              currentStatus={ato.workflow_status} 
                              className="scale-75 origin-left"
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const count = ato.configurations?.length || 0;
                        if (count === 0) {
                          return (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 dark:border-orange-700">
                              <Package className="h-3 w-3 mr-1" />
                              Sem itens
                            </Badge>
                          );
                        }
                        return (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            <Package className="h-3 w-3 mr-1" />
                            {count} {count === 1 ? "item" : "itens"}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={
                            ato.price_impact > 0
                              ? "text-green-600 font-semibold"
                              : ato.price_impact < 0
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {ato.price_impact > 0 ? "+" : ""}
                          {formatCurrency(ato.price_impact)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={
                            ato.delivery_days_impact > 0
                              ? "text-orange-600 font-semibold"
                              : ""
                          }
                        >
                          {ato.delivery_days_impact > 0 ? "+" : ""}
                          {ato.delivery_days_impact} dias
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getATOStatusColor(ato.status)}>
                        {getATOStatusLabel(ato.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ato.requested_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão "Revisar Workflow" se usuário é responsável */}
                        {userPendingATOs.some(task => task.ato_id === ato.id) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openATOForReview(ato.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Wrench className="mr-1 h-3 w-3" />
                            Revisar Workflow
                          </Button>
                        )}
                        
                        {/* Botão "Revisar e Enviar" quando workflow completo */}
                        {ato.workflow_status === 'completed' && ato.status === 'draft' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setCommercialReviewDialog({ open: true, ato })}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <DollarSign className="mr-1 h-3 w-3" />
                            Revisar e Enviar
                          </Button>
                        )}

                        {/* Botão "Aplicar Desconto / Enviar" para ATOs aprovadas legadas (sem validação comercial) */}
                        {ato.status === 'approved' && ato.workflow_status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await reopenATO(ato.id);
                              setCommercialReviewDialog({ open: true, ato });
                            }}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <DollarSign className="mr-1 h-3 w-3" />
                            Aplicar Desconto / Enviar
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedATO(ato.id)}
                        >
                          Ver
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {createDialogOpen && (
        <CreateATODialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          contractId={contractId}
        />
      )}

      <ATODetailDialog
        open={!!selectedATO}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedATO(null);
            setDetailsTab(undefined);
          }
        }}
        atoId={selectedATO}
        defaultTab={detailsTab}
      />

      {commercialReviewDialog.ato && workflowData && (
        <ATOCommercialReviewDialog
          open={commercialReviewDialog.open}
          onOpenChange={(open) => setCommercialReviewDialog({ open, ato: undefined })}
          ato={commercialReviewDialog.ato}
          pmAnalysis={workflowData.workflow_steps?.find((s: any) => s.step_type === 'pm_review')?.response_data || {
            materials: [],
            total_materials_cost: 0,
            labor_hours: 0,
            labor_cost_per_hour: 55,
            total_labor_cost: 0,
            total_cost: 0,
            suggested_price: 0,
            final_price: commercialReviewDialog.ato.price_impact || 0,
          }}
          onProceedToSend={handleCommercialReview}
        />
      )}

      {sendATODialog.ato && (
        <SendATOToClientDialog
          open={sendATODialog.open}
          onOpenChange={(open) => {
            setSendATODialog({ open, ato: undefined });
            if (!open) setPendingDiscount(0);
          }}
          atoNumber={sendATODialog.ato.ato_number}
          atoTitle={sendATODialog.ato.title}
          clientName={sendATODialog.ato.contract?.client?.name}
          clientEmail={sendATODialog.ato.contract?.client?.email}
          onSend={handleSendATO}
        />
      )}
    </div>
  );
}
