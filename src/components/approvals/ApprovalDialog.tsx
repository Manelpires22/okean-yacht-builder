import { useState } from "react";
import { useApproval, useReviewApproval } from "@/hooks/useApprovals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Calendar, User, Package, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ApprovalDialogProps {
  approvalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApprovalDialog({ approvalId, open, onOpenChange }: ApprovalDialogProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const { data: approval, isLoading } = useApproval(approvalId || "");
  const reviewMutation = useReviewApproval();

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!approvalId) return;

    await reviewMutation.mutateAsync({
      id: approvalId,
      status,
      review_notes: reviewNotes
    });

    setReviewNotes("");
    onOpenChange(false);
  };

  if (isLoading || !approval) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pendente" },
      approved: { variant: "default" as const, label: "Aprovada" },
      rejected: { variant: "destructive" as const, label: "Rejeitada" }
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getTypeBadge = (type: string) => {
    return type === 'discount' ? 'Desconto' : 'Customização';
  };

  const statusBadge = getStatusBadge(approval.status);
  const isPending = approval.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Solicitação
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            Revise os detalhes e tome uma decisão sobre esta solicitação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Cotação */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Informações da Cotação
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Número:</span>
                <p className="font-medium">{approval.quotations?.quotation_number}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium">{approval.quotations?.client_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Modelo:</span>
                <p className="font-medium">{approval.quotations?.yacht_models?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <Badge variant="outline">{getTypeBadge(approval.approval_type)}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Valores */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Preço Base:</span>
                <p className="font-medium">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(Number(approval.quotations?.base_price) || 0)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Opcionais:</span>
                <p className="font-medium">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(Number(approval.quotations?.total_options_price) || 0)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Desconto:</span>
                <p className="font-medium text-red-600">
                  {approval.quotations?.discount_percentage}% 
                  ({new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(Number(approval.quotations?.discount_amount) || 0)})
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Preço Final:</span>
                <p className="font-bold text-lg">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(Number(approval.quotations?.final_price) || 0)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Solicitante */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Solicitante
            </h3>
            <div className="text-sm">
              <p className="font-medium">{approval.requester?.full_name}</p>
              <p className="text-muted-foreground">{approval.requester?.email}</p>
              <p className="text-muted-foreground">{approval.requester?.department}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(approval.requested_at), "PPP 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          {approval.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Observações do Solicitante</h3>
                <p className="text-sm text-muted-foreground">{approval.notes}</p>
              </div>
            </>
          )}

          {approval.request_details && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Detalhes da Solicitação</h3>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(approval.request_details, null, 2)}
                </pre>
              </div>
            </>
          )}

          {!isPending && approval.reviewer && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">Revisão</h3>
                <div className="text-sm">
                  <p className="font-medium">{approval.reviewer.full_name}</p>
                  <p className="text-muted-foreground">{approval.reviewer.email}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {approval.reviewed_at && format(new Date(approval.reviewed_at), "PPP 'às' HH:mm", { locale: ptBR })}
                  </p>
                  {approval.review_notes && (
                    <p className="mt-2 text-sm">{approval.review_notes}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {isPending && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="review-notes">Observações da Revisão</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Adicione observações sobre sua decisão..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {isPending ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={reviewMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReview('rejected')}
                disabled={reviewMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rejeitar
              </Button>
              <Button
                onClick={() => handleReview('approved')}
                disabled={reviewMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
