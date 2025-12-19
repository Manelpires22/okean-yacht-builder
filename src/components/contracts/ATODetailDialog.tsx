import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useATO, useApproveATO, useCancelATO, useDeleteATO } from "@/hooks/useATOs";
import { useATOConfigurations, useRemoveATOConfiguration } from "@/hooks/useATOConfigurations";
import { useSendATO } from "@/hooks/useSendATO";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/quotation-utils";
import { getATOStatusLabel, getATOStatusColor } from "@/lib/contract-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
  Plus,
  Trash2,
  Package,
  Wrench,
  Clock,
  Pencil,
  Send,
  MinusCircle,
  Download,
  ArrowUpCircle,
  FileEdit,
  Settings,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useATOWorkflow } from "@/hooks/useATOWorkflow";
import { ATOConfigurationDialog } from "./ATOConfigurationDialog";
import { ATOWorkflowTimeline } from "./ATOWorkflowTimeline";
import { ATOPMReviewForm } from "./ATOPMReviewForm";
import { EditATODialog } from "./EditATODialog";
import { SendATOToClientDialog } from "./SendATOToClientDialog";
import { CreateATODialog } from "./CreateATODialog";

interface ATODetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atoId: string | null;
  defaultTab?: string;
}

export function ATODetailDialog({
  open,
  onOpenChange,
  atoId,
  defaultTab = "details",
}: ATODetailDialogProps) {
  const { data: ato, isLoading } = useATO(atoId || undefined);
  const { data: configurations, isLoading: loadingConfigurations } = useATOConfigurations(atoId || undefined);
  const { data: workflowData, isLoading: loadingWorkflow } = useATOWorkflow(atoId || undefined);
  const { mutate: approveATO, isPending: isApproving } = useApproveATO();
  const { mutate: cancelATO, isPending: isCanceling } = useCancelATO();
  const { mutate: deleteATO, isPending: isDeleting } = useDeleteATO();
  const { mutate: removeConfiguration, isPending: isRemoving } = useRemoveATOConfiguration();
  const { mutate: sendATO, isPending: isSending } = useSendATO();
  const { data: userRoleData } = useUserRole();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showCreateReversalDialog, setShowCreateReversalDialog] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const isAdmin = userRoleData?.roles?.includes('administrador');
  
  const canApprove =
    userRoleData?.roles?.some((r: string) =>
      ["administrador", "gerente_comercial"].includes(r)
    ) && ato?.status === "pending_approval";

  const canCancel =
    userRoleData?.roles?.some((r: string) =>
      ["administrador", "gerente_comercial"].includes(r)
    ) && ato?.status !== "cancelled";

  // Permissões de edição e exclusão
  const isNotApproved = ato?.status !== 'approved';
  const canEdit = isNotApproved && (isAdmin || ato?.requested_by === user?.id);
  const canDelete = isNotApproved && isAdmin;
  
  // Pode criar ATO de estorno apenas para ATOs aprovadas
  const canCreateReversal = ato?.status === 'approved' && (isAdmin || userRoleData?.roles?.includes('gerente_comercial'));
  
  // ✅ Pode enviar ao cliente quando workflow completo e desconto ≤ 10%
  // Aceita tanto 'draft' quanto 'pending_approval' (caso sistema tenha marcado errado)
  const canSendToClient = 
    ato?.workflow_status === 'completed' && 
    (ato?.discount_percentage || 0) <= 10 &&
    (ato?.status === 'draft' || ato?.status === 'pending_approval');

  // Workflow logic
  const currentStep = workflowData?.workflow_steps?.find(
    (step) => step.status === "pending"
  );
  const canActOnWorkflow = currentStep?.assigned_to === user?.id || isAdmin;
  const hasActiveWorkflow = ato?.workflow_status && ato.workflow_status !== "completed" && ato.workflow_status !== "rejected";

  // Sincronizar activeTab com defaultTab quando dialog abre
  useEffect(() => {
    if (open && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const handleApprove = () => {
    if (!atoId) return;
    approveATO(
      { atoId, approved: true, notes: approvalNotes },
      {
        onSuccess: () => {
          setShowApproveDialog(false);
          setApprovalNotes("");
          onOpenChange(false);
        },
      }
    );
  };

  const handleCancel = () => {
    if (!atoId) return;
    cancelATO(atoId, {
      onSuccess: () => {
        setShowCancelDialog(false);
        onOpenChange(false);
      },
    });
  };

  const handleDelete = () => {
    if (!atoId) return;
    deleteATO(atoId, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        onOpenChange(false);
      },
    });
  };

  const handleSendToClient = async (sendData: any) => {
    if (!atoId || !ato) return;
    
    sendATO({
      atoId,
      discountPercentage: ato.discount_percentage || 0,
      sendEmail: sendData.sendEmail,
      generatePDF: sendData.generatePDF,
      recipientEmail: sendData.recipientEmail,
      emailSubject: sendData.emailSubject,
      emailMessage: sendData.emailMessage,
    }, {
      onSuccess: () => {
        setShowSendDialog(false);
        onOpenChange(false);
      },
    });
  };

  const base64ToBlob = (base64: string, type: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type });
  };

  const handleExportATOPDF = async () => {
    if (!atoId || !ato) return;
    
    setIsDownloadingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ato-pdf', {
        body: { ato_id: atoId }
      });

      if (error) throw error;

      if (data.format === 'pdf') {
        const pdfBlob = base64ToBlob(data.data, 'application/pdf');
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ato.ato_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('PDF da ATO gerado com sucesso!');
      } else {
        toast.error('Erro ao gerar PDF. Por favor, tente novamente.');
      }
    } catch (error: any) {
      console.error('Error generating ATO PDF:', error);
      toast.error('Erro ao gerar PDF: ' + error.message);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (!open || !atoId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !ato ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ATO não encontrada</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {ato.ato_number}
                        </DialogTitle>
                        <DialogDescription>{ato.title}</DialogDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleExportATOPDF}
                          disabled={isDownloadingPDF}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {isDownloadingPDF ? 'Gerando...' : 'Exportar PDF'}
                        </Button>
                        <Badge className={getATOStatusColor(ato.status as any)}>
                          {getATOStatusLabel(ato.status as any)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="items">
                    Itens Configurados
                    {configurations && configurations.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {configurations.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  {hasActiveWorkflow && (
                    <TabsTrigger value="workflow">
                      Workflow
                      {canActOnWorkflow && (
                        <Badge variant="default" className="ml-2">
                          Aguardando Ação
                        </Badge>
                      )}
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  {/* Description */}
                  {ato.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Descrição</h3>
                      <p className="text-sm text-muted-foreground">
                        {ato.description}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Financial Impact */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Impacto Financeiro</span>
                      </div>
                      <p
                        className={`text-2xl font-bold ${
                          ato.price_impact > 0
                            ? "text-green-600"
                            : ato.price_impact < 0
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {ato.price_impact > 0 ? "+" : ""}
                        {formatCurrency(ato.price_impact)}
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Impacto no Prazo</span>
                      </div>
                      <p
                        className={`text-2xl font-bold ${
                          ato.delivery_days_impact > 0 ? "text-orange-600" : ""
                        }`}
                      >
                        {ato.delivery_days_impact > 0 ? "+" : ""}
                        {ato.delivery_days_impact} dias
                      </p>
                    </div>
                  </div>

                  {/* Desconto e Preço Final (se houver desconto) */}
                  {ato.discount_percentage > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium">Desconto Aplicado</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">
                          {ato.discount_percentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Preço Final</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(ato.price_impact * (1 - (ato.discount_percentage || 0) / 100))}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Linha do Tempo</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Solicitado em:</span>
                        <span>
                          {format(new Date(ato.requested_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {ato.approved_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aprovado em:</span>
                          <span>
                            {format(new Date(ato.approved_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {ato.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Observações Internas</h3>
                      <p className="text-sm text-muted-foreground">{ato.notes}</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {ato.status === "rejected" && ato.rejection_reason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <h3 className="font-semibold text-destructive mb-2">
                        Motivo da Rejeição
                      </h3>
                      <p className="text-sm">{ato.rejection_reason}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="items" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Itens Vinculados</h3>
                      <p className="text-sm text-muted-foreground">
                        Opcionais e itens do memorial vinculados a esta ATO
                      </p>
                    </div>
                    {ato.status === "draft" && (
                      <Button size="sm" onClick={() => setShowConfigDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Item
                      </Button>
                    )}
                  </div>

                  {loadingConfigurations ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : !configurations || configurations.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">Nenhum item configurado</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione opcionais ou itens do memorial a esta ATO
                      </p>
                      {ato.status === "draft" && (
                        <Button onClick={() => setShowConfigDialog(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Primeiro Item
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {configurations.map((config) => {
                        let itemName =
                          config.configuration_details?.item_name ||
                          config.notes ||
                          `Item (${config.item_type})`;
                        let itemDescription = config.configuration_details?.description || "";
                        let badgeLabel = "";
                        let badgeVariant: "default" | "secondary" | "outline" = "outline";
                        let ItemIcon = Package;

                        switch (config.item_type) {
                          case "option":
                            badgeLabel = "Opcional";
                            ItemIcon = Package;
                            break;
                          case "memorial_item":
                            badgeLabel = "Memorial";
                            ItemIcon = Wrench;
                            break;
                          case "upgrade":
                            badgeLabel = "Upgrade";
                            ItemIcon = ArrowUpCircle;
                            break;
                          case "ato_item":
                            badgeLabel = "Item ATO";
                            ItemIcon = FileEdit;
                            break;
                          case "free_customization":
                            badgeLabel = "Customização";
                            ItemIcon = Pencil;
                            break;
                          case "definable_item":
                            badgeLabel = "Definição";
                            ItemIcon = Settings;
                            break;
                          default:
                            badgeLabel = String(config.item_type || "Item");
                        }

                        const hasDiscount = (config.discount_percentage || 0) > 0;
                        const originalPrice = config.original_price || 0;
                        const finalPrice = originalPrice * (1 - (config.discount_percentage || 0) / 100);

                        return (
                          <div
                            key={config.id}
                            className="border rounded-lg p-4 hover:bg-accent transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <ItemIcon className="h-4 w-4 text-primary" />
                                  <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                                </div>

                                <h4 className="font-semibold mb-1">{itemName}</h4>

                                {itemDescription && (
                                  <p className="text-sm text-muted-foreground">{itemDescription}</p>
                                )}

                                {originalPrice > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    {hasDiscount ? (
                                      <>
                                        <span className="text-sm line-through text-muted-foreground">
                                          {formatCurrency(originalPrice)}
                                        </span>
                                        <span className="text-sm font-medium text-green-600">
                                          {formatCurrency(finalPrice)}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                          -{config.discount_percentage}%
                                        </Badge>
                                      </>
                                    ) : (
                                      <span className="text-sm font-medium">{formatCurrency(originalPrice)}</span>
                                    )}
                                  </div>
                                )}

                                {config.notes && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">{config.notes}</p>
                                )}
                              </div>

                              {ato.status === "draft" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeConfiguration({
                                      configId: config.id,
                                      atoId: ato.id,
                                    })
                                  }
                                  disabled={isRemoving}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {hasActiveWorkflow && (
                  <TabsContent value="workflow" className="space-y-6">
                    {/* Workflow Timeline */}
                    <div>
                      <h3 className="font-semibold mb-4">Progresso do Workflow</h3>
                      <ATOWorkflowTimeline 
                        status={ato.status}
                        workflowStatus={ato.workflow_status}
                      />
                    </div>

                    <Separator />

                    {/* Current Step Form */}
                    {loadingWorkflow ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : currentStep && canActOnWorkflow && workflowData ? (
                      <div>
                        <h3 className="font-semibold mb-4">Sua Ação Requerida</h3>
                        {currentStep.step_type === "pm_review" && (
                          <ATOPMReviewForm
                            atoWorkflow={workflowData}
                            currentStep={currentStep}
                          />
                        )}
                      </div>
                    ) : currentStep ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">Aguardando Outro Responsável</h3>
                        <p className="text-sm text-muted-foreground">
                          Esta etapa está atribuída a{" "}
                          <span className="font-medium">{currentStep.assigned_to}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                        <h3 className="font-semibold mb-2">Workflow Concluído</h3>
                        <p className="text-sm text-muted-foreground">
                          Todas as etapas foram finalizadas com sucesso
                        </p>
                      </div>
                    )}

                    {/* Workflow History */}
                    {workflowData?.workflow_steps && workflowData.workflow_steps.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-semibold mb-4">Histórico de Etapas</h3>
                          <div className="space-y-3">
                            {workflowData.workflow_steps
                              .filter((step) => step.status === "completed")
                              .map((step) => (
                                <div
                                  key={step.id}
                                  className="border rounded-lg p-4 bg-muted/50"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      <span className="font-medium">
                                        {step.step_type === "pm_review" && "Análise PM"}
                                        {step.step_type === "supply_quote" && "Cotação Supply"}
                                        {step.step_type === "planning_validation" &&
                                          "Validação Planning"}
                                        {step.step_type === "pm_final" && "Aprovação Final PM"}
                                      </span>
                                    </div>
                                    {step.completed_at && (
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(step.completed_at), "dd/MM/yyyy HH:mm", {
                                          locale: ptBR,
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  {step.notes && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      {step.notes}
                                    </p>
                                  )}
                                  {step.response_data && (
                                    <div className="mt-2 text-xs space-y-1">
                                      {(step.response_data as any).supply_cost && (
                                        <div>
                                          <span className="text-muted-foreground">Custo: </span>
                                          <span className="font-medium">
                                            {formatCurrency((step.response_data as any).supply_cost)}
                                          </span>
                                        </div>
                                      )}
                                      {(step.response_data as any).planning_delivery_impact_days !==
                                        undefined && (
                                        <div>
                                          <span className="text-muted-foreground">Prazo: </span>
                                          <span className="font-medium">
                                            {(step.response_data as any).planning_delivery_impact_days}{" "}
                                            dias
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                )}
              </Tabs>

              <DialogFooter className="flex items-center justify-between">
                <div className="flex gap-2">
                  {canCreateReversal && (
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateReversalDialog(true)}
                      className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                    >
                      <MinusCircle className="mr-2 h-4 w-4" />
                      Criar ATO de Estorno
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                    >
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  )}
                  {canCancel && ato.status !== "cancelled" && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isCanceling}
                    >
                      {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar ATO
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setShowEditDialog(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  )}
                  
                  {canSendToClient && (
                    <Button
                      onClick={() => setShowSendDialog(true)}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Enviar ao Cliente
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Fechar
                  </Button>

                  {canApprove && (
                    <Button onClick={() => setShowApproveDialog(true)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprovar ATO
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar ATO {ato?.ato_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá aplicar as modificações ao contrato, atualizando o valor
              total e o prazo de entrega.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Impacto no Preço:</span>
                <span className="font-bold text-green-600">
                  +{formatCurrency(ato?.price_impact || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Impacto no Prazo:</span>
                <span className="font-bold text-orange-600">
                  +{ato?.delivery_days_impact || 0} dias
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas de Aprovação (Opcional)</Label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Adicione observações sobre esta aprovação..."
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
              {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Aprovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar ATO {ato?.ato_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A ATO será marcada como cancelada e
              não poderá ser aprovada posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Configuration Dialog */}
      {atoId && (
        <ATOConfigurationDialog
          open={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          atoId={atoId}
          contractId={ato?.contract_id || ""}
        />
      )}

      {/* Edit ATO Dialog */}
      {ato && (
        <EditATODialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          ato={ato}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ATO {ato?.ato_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A ATO será permanentemente excluída do sistema,
              incluindo todas as suas configurações e histórico de workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Configuration Dialog */}
      {showConfigDialog && ato && (
        <ATOConfigurationDialog
          open={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          atoId={atoId!}
          contractId={ato.contract_id}
        />
      )}

      {/* Edit Dialog */}
      {ato && showEditDialog && (
        <EditATODialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          ato={ato}
        />
      )}

      {/* Send to Client Dialog */}
      {ato && showSendDialog && (
        <SendATOToClientDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          atoNumber={ato.ato_number}
          atoTitle={ato.title}
          clientName={ato.contract?.client?.name}
          clientEmail={ato.contract?.client?.email}
          onSend={handleSendToClient}
        />
      )}

      {/* Create Reversal ATO Dialog */}
      {ato && showCreateReversalDialog && (
        <CreateATODialog
          open={showCreateReversalDialog}
          onOpenChange={setShowCreateReversalDialog}
          contractId={ato.contract_id}
          reversalOf={{
            atoNumber: ato.ato_number,
            title: ato.title,
            priceImpact: ato.price_impact,
            deliveryDaysImpact: ato.delivery_days_impact,
          }}
        />
      )}
    </>
  );
}
