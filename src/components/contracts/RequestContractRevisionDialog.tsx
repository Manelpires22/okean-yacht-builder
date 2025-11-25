import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateATO } from "@/hooks/useATOs";
import { useQueryClient } from "@tanstack/react-query";
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

  const { mutate: createATO, isPending } = useCreateATO();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim()) {
      toast.error("Nome do item é obrigatório");
      return;
    }

    // Criar ATO diretamente com workflow técnico
    createATO(
      {
        contract_id: contractId,
        title: itemName,
        description: description,
        price_impact: 0,
        delivery_days_impact: 0,
        workflow_status: 'pending_pm_review',
        notes: `Quantidade: ${quantity}`,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["atos"] });
          queryClient.invalidateQueries({ queryKey: ["live-contract"] });
          
          toast.success("Solicitação de mudança criada!", {
            description: `"${itemName}" entrará no workflow de aprovação técnica.`,
          });

          // Reset form
          setItemName("");
          setDescription("");
          setQuantity(1);
          onOpenChange(false);
        },
        onError: (error: Error) => {
          console.error("Error creating ATO:", error);
          toast.error("Erro ao criar solicitação", {
            description: error.message,
          });
        },
      }
    );
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
            Crie uma solicitação de mudança que passará por workflow técnico completo (PM → Supply → Planning → PM Final) antes de ser aprovada como ATO.
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
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
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
