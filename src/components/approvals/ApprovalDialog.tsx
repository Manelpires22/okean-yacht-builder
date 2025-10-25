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
import { Input } from "@/components/ui/input";
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
  const [additionalCost, setAdditionalCost] = useState("");
  const [deliveryImpactDays, setDeliveryImpactDays] = useState("");
  const { data: approval, isLoading } = useApproval(approvalId || "");
  const reviewMutation = useReviewApproval();

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!approvalId) return;

    const reviewData: any = {
      id: approvalId,
      status,
      review_notes: reviewNotes
    };

    // Para aprovações técnicas aprovadas, incluir custos e impactos
    if (approval?.approval_type === 'technical' && status === 'approved') {
      if (additionalCost) {
        reviewData.additional_cost = parseFloat(additionalCost);
      }
      if (deliveryImpactDays) {
        reviewData.delivery_impact_days = parseInt(deliveryImpactDays);
      }
    }

    await reviewMutation.mutateAsync(reviewData);

    setReviewNotes("");
    setAdditionalCost("");
    setDeliveryImpactDays("");
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
    if (type === 'commercial') return 'Desconto Comercial';
    if (type === 'technical') return 'Validação Técnica';
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

          {/* Valores - Commercial */}
          {approval.approval_type === 'commercial' && approval.request_details && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {approval.request_details.discount_type === 'base' ? 'Desconto sobre Valor Base' : 'Desconto sobre Opcionais'}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor Original:</span>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(Number(approval.request_details.original_price) || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Desconto:</span>
                  <p className="font-medium text-destructive">
                    {approval.request_details.discount_percentage}% 
                    (-{new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(Number(approval.request_details.discount_amount) || 0)})
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Valor Final:</span>
                  <p className="font-bold text-lg">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(Number(approval.request_details.final_price) || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customization Details - Technical */}
          {approval.approval_type === 'technical' && approval.request_details && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Customização Solicitada
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground">Item:</span>
                  <p className="font-medium">{approval.request_details.customization_item_name}</p>
                </div>
                
                {/* Tipo de item - Base, Opcional ou Customização Livre */}
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <div className="mt-1">
                    {approval.request_details.memorial_item_id ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        Item de Base (Memorial Descritivo)
                      </Badge>
                    ) : approval.request_details.is_optional ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                        Opcional com Custo Extra
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                        Customização Livre (Item Novo)
                      </Badge>
                    )}
                  </div>
                </div>

                {approval.request_details.quantity > 1 && (
                  <div>
                    <span className="text-muted-foreground">Quantidade:</span>
                    <p className="font-medium">{approval.request_details.quantity}</p>
                  </div>
                )}
                {approval.request_details.notes && (
                  <div>
                    <span className="text-muted-foreground">Observações:</span>
                    <p className="text-sm whitespace-pre-wrap">{approval.request_details.notes}</p>
                  </div>
                )}
                {approval.request_details.image_url && (
                  <div>
                    <span className="text-muted-foreground">Imagem de Referência:</span>
                    <img 
                      src={approval.request_details.image_url} 
                      alt="Customização" 
                      className="mt-2 max-w-md rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Solicitante */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Solicitante
            </h3>
            <div className="text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(approval.requested_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
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
              
              {/* Campos específicos para aprovação técnica */}
              {approval.approval_type === 'technical' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Análise Técnica</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="additional-cost">Custo Adicional (R$)</Label>
                      <Input
                        id="additional-cost"
                        type="number"
                        placeholder="0,00"
                        value={additionalCost}
                        onChange={(e) => setAdditionalCost(e.target.value)}
                        step="0.01"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe em branco se não houver custo adicional
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="delivery-impact">Impacto na Entrega (dias)</Label>
                      <Input
                        id="delivery-impact"
                        type="number"
                        placeholder="0"
                        value={deliveryImpactDays}
                        onChange={(e) => setDeliveryImpactDays(e.target.value)}
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dias adicionais necessários para entrega
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
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
