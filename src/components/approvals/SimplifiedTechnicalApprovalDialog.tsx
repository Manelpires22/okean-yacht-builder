import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SimplifiedTechnicalApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approval: {
    id: string;
    quotation_id: string;
    request_details: {
      customization_id: string;
      customization_code?: string;
      item_name: string;
    };
    notes?: string;
    requested_at: string;
    quotations: {
      quotation_number: string;
      client_name: string;
    };
  };
}

export function SimplifiedTechnicalApprovalDialog({
  open,
  onOpenChange,
  approval,
}: SimplifiedTechnicalApprovalDialogProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [additionalCost, setAdditionalCost] = useState<string>("");
  const [deliveryImpact, setDeliveryImpact] = useState<string>("");
  const [engineeringNotes, setEngineeringNotes] = useState<string>("");

  const reviewMutation = useMutation({
    mutationFn: async (params: {
      approvalId: string;
      customizationId: string;
      action: 'approve' | 'reject';
      additionalCost: number;
      deliveryImpact: number;
      engineeringNotes: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Atualizar a customização (com fallback por nome)
      // Primeiro verifica se a customização existe pelo ID
      const { data: existingById } = await supabase
        .from('quotation_customizations')
        .select('id')
        .eq('id', params.customizationId)
        .maybeSingle();

      let targetId = params.customizationId;

      // Se não encontrou por ID, busca pelo nome na mesma cotação
      if (!existingById) {
        console.log(`Customização ${params.customizationId} não encontrada, buscando por nome...`);
        const { data: byName } = await supabase
          .from('quotation_customizations')
          .select('id')
          .eq('quotation_id', approval.quotation_id)
          .eq('item_name', approval.request_details.item_name)
          .eq('status', 'pending')
          .maybeSingle();
        
        if (byName) {
          console.log(`Customização encontrada por nome com ID: ${byName.id}`);
          targetId = byName.id;
        } else {
          throw new Error(`Customização "${approval.request_details.item_name}" não encontrada. Pode ter sido removida.`);
        }
      }

      // Atualiza usando o targetId correto
      const { error: customizationError, data: updatedData } = await supabase
        .from('quotation_customizations')
        .update({
          status: params.action === 'approve' ? 'approved' : 'rejected',
          workflow_status: params.action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          pm_final_price: params.action === 'approve' ? params.additionalCost : 0,
          pm_final_delivery_impact_days: params.action === 'approve' ? params.deliveryImpact : 0,
          engineering_notes: params.engineeringNotes,
          reject_reason: params.action === 'reject' ? params.engineeringNotes : null,
        })
        .eq('id', targetId)
        .select();

      if (customizationError) throw customizationError;
      
      if (!updatedData || updatedData.length === 0) {
        throw new Error('Nenhuma customização foi atualizada. Verifique se o registro ainda existe.');
      }

      // 3. Se aprovado, recalcular totais da cotação
      if (params.action === 'approve' && (params.additionalCost > 0 || params.deliveryImpact > 0)) {
        const { data: quotation, error: quotationFetchError } = await supabase
          .from('quotations')
          .select('id, final_price, total_delivery_days, total_customizations_price')
          .eq('id', approval.quotation_id)
          .single();

        if (quotationFetchError) throw quotationFetchError;

        const newCustomizationsPrice = (quotation.total_customizations_price || 0) + params.additionalCost;
        const newTotalPrice = quotation.final_price + params.additionalCost;
        const newTotalDeliveryDays = quotation.total_delivery_days + params.deliveryImpact;

        const { error: quotationUpdateError } = await supabase
          .from('quotations')
          .update({
            total_customizations_price: newCustomizationsPrice,
            final_price: newTotalPrice,
            total_delivery_days: newTotalDeliveryDays,
          })
          .eq('id', approval.quotation_id);

        if (quotationUpdateError) throw quotationUpdateError;
      }

      return { action: params.action };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['customizations'] });

      toast.success(
        data.action === 'approve' 
          ? 'Customização aprovada com sucesso!' 
          : 'Customização rejeitada com sucesso!'
      );

      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao processar aprovação', {
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (!action) return;

    if (action === 'approve') {
      const cost = parseFloat(additionalCost) || 0;
      const days = parseInt(deliveryImpact) || 0;

      if (cost < 0 || days < 0) {
        toast.error('Valores não podem ser negativos');
        return;
      }
    }

    if (action === 'reject' && !engineeringNotes.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    reviewMutation.mutate({
      approvalId: approval.id,
      customizationId: approval.request_details.customization_id,
      action,
      additionalCost: parseFloat(additionalCost) || 0,
      deliveryImpact: parseInt(deliveryImpact) || 0,
      engineeringNotes: engineeringNotes.trim(),
    });
  };

  const resetForm = () => {
    setAction(null);
    setAdditionalCost("");
    setDeliveryImpact("");
    setEngineeringNotes("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Aprovar Customização Técnica</DialogTitle>
          <DialogDescription>
            Analise a solicitação e forneça sua decisão como PM de Engenharia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações da Solicitação */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cotação:</span>
              <Badge variant="outline">{approval.quotations.quotation_number}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cliente:</span>
              <span className="text-sm">{approval.quotations.client_name}</span>
            </div>
            {approval.request_details.customization_code && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Código:</span>
                <Badge>{approval.request_details.customization_code}</Badge>
              </div>
            )}
            <div className="pt-2 border-t">
              <span className="text-sm font-medium">Item:</span>
              <p className="text-sm mt-1">{approval.request_details.item_name}</p>
            </div>
            {approval.notes && (
              <div className="pt-2 border-t">
                <span className="text-sm font-medium">Solicitação do Vendedor:</span>
                <p className="text-sm mt-1 text-muted-foreground">{approval.notes}</p>
              </div>
            )}
          </div>

          {/* Seleção de Ação */}
          {!action && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Escolha uma ação abaixo para continuar
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant={action === 'approve' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setAction('approve')}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar
            </Button>
            <Button
              variant={action === 'reject' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => setAction('reject')}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>
          </div>

          {/* Formulário de Aprovação */}
          {action === 'approve' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="additional-cost">
                  Custo Adicional (R$)
                </Label>
                <Input
                  id="additional-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={additionalCost}
                  onChange={(e) => setAdditionalCost(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe 0 se não houver custo adicional
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery-impact">
                  Impacto no Prazo (dias)
                </Label>
                <Input
                  id="delivery-impact"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={deliveryImpact}
                  onChange={(e) => setDeliveryImpact(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe 0 se não houver impacto no prazo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineering-notes">
                  Observações de Engenharia (opcional)
                </Label>
                <Textarea
                  id="engineering-notes"
                  placeholder="Ex: Será necessário reforço estrutural adicional..."
                  value={engineeringNotes}
                  onChange={(e) => setEngineeringNotes(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {engineeringNotes.length}/1000 caracteres
                </p>
              </div>
            </div>
          )}

          {/* Formulário de Rejeição */}
          {action === 'reject' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Motivo da Rejeição <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Ex: Customização não é viável devido a limitações estruturais..."
                  value={engineeringNotes}
                  onChange={(e) => setEngineeringNotes(e.target.value)}
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {engineeringNotes.length}/1000 caracteres
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={reviewMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!action || reviewMutation.isPending}
          >
            {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
