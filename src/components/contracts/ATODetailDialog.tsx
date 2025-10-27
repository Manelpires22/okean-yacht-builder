import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useATO, useApproveATO, useCancelATO } from "@/hooks/useATOs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/quotation-utils";
import { getATOStatusLabel, getATOStatusColor } from "@/lib/contract-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface ATODetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atoId: string | null;
}

export function ATODetailDialog({
  open,
  onOpenChange,
  atoId,
}: ATODetailDialogProps) {
  const { data: ato, isLoading } = useATO(atoId || undefined);
  const { mutate: approveATO, isPending: isApproving } = useApproveATO();
  const { mutate: cancelATO, isPending: isCanceling } = useCancelATO();
  const { data: userRoleData } = useUserRole();

  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const canApprove =
    userRoleData?.roles?.some((r: string) =>
      ["administrador", "gerente_comercial"].includes(r)
    ) && ato?.status === "pending_approval";

  const canCancel =
    userRoleData?.roles?.some((r: string) =>
      ["administrador", "gerente_comercial"].includes(r)
    ) && ato?.status !== "cancelled";

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
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {ato.ato_number}
                    </DialogTitle>
                    <DialogDescription>{ato.title}</DialogDescription>
                  </div>
                  <Badge className={getATOStatusColor(ato.status as any)}>
                    {getATOStatusLabel(ato.status as any)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
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
              </div>

              <DialogFooter className="flex items-center justify-between">
                <div>
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
    </>
  );
}
