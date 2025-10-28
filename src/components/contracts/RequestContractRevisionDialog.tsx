import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";

interface RequestContractRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  quotationId: string;
}

export function RequestContractRevisionDialog({
  open,
  onOpenChange,
  contractId,
  quotationId,
}: RequestContractRevisionDialogProps) {
  const queryClient = useQueryClient();
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);

  const createRevision = useMutation({
    mutationFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create the customization
      const { data: customization, error: customizationError } = await supabase
        .from("quotation_customizations")
        .insert({
          quotation_id: quotationId,
          item_name: itemName,
          notes: description,
          quantity: quantity,
          status: "pending",
          workflow_status: null, // Will be set to pending_pm_review after approval
          included_in_contract: false, // Marca como revisão pós-contrato
        })
        .select()
        .single();

      if (customizationError) throw customizationError;

      // Create the approval request
      const { error: approvalError } = await supabase
        .from("approvals")
        .insert({
          quotation_id: quotationId,
          approval_type: "technical",
          requested_by: user.id,
          status: "pending",
          request_details: {
            is_contract_revision: true,
            customization_id: customization.id,
            item_name: itemName,
            description: description,
            quantity: quantity,
          },
          notes: `Revisão de contrato: ${itemName}`,
        });

      if (approvalError) throw approvalError;

      return customization;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotation-customizations"] });
      queryClient.invalidateQueries({ queryKey: ["contract-revisions"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-count"] });
      
      toast.success("Revisão de contrato criada!", {
        description: `"${data.item_name}" entrará no workflow de aprovação.`,
      });

      // Reset form
      setItemName("");
      setDescription("");
      setQuantity(1);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Error creating revision:", error);
      toast.error("Erro ao criar revisão", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim()) {
      toast.error("Nome do item é obrigatório");
      return;
    }

    createRevision.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solicitar Revisão de Contrato
          </DialogTitle>
          <DialogDescription>
            Crie uma solicitação de mudança que passará por aprovação técnica antes de poder ser convertida em ATO.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="item_name">
              Nome do Item / Mudança Solicitada *
            </Label>
            <Input
              id="item_name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Ex: Adicionar sistema de som premium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva em detalhes a mudança solicitada, requisitos técnicos, especificações..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Próximos Passos:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Aprovação técnica inicial</li>
              <li>PM de Engenharia avaliará escopo e viabilidade</li>
              <li>Suprimentos cotará itens necessários</li>
              <li>Planejamento definirá impacto no prazo</li>
              <li>Após aprovação final, poderá converter em ATO</li>
            </ol>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createRevision.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createRevision.isPending}>
              {createRevision.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Solicitação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
