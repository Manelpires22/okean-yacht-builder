import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFinalizeDelivery } from "@/hooks/useFinalizeDelivery";
import { CheckCircle2 } from "lucide-react";

interface FinalizeDeliveryDialogProps {
  contractId: string;
  isAllVerified: boolean;
}

export function FinalizeDeliveryDialog({
  contractId,
  isAllVerified,
}: FinalizeDeliveryDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const { mutate: finalizeDelivery, isPending } = useFinalizeDelivery();

  const handleFinalize = () => {
    finalizeDelivery(
      {
        contractId,
        deliveryNotes: notes,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setNotes("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          disabled={!isAllVerified}
          className="w-full"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          {isAllVerified
            ? "Finalizar Entrega do Barco"
            : "Aguardando Verificação de Todos os Itens"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Finalizar Entrega do Barco</DialogTitle>
          <DialogDescription>
            Confirme que todos os itens foram verificados e o barco está pronto para ser
            entregue ao cliente. Esta ação marcará o contrato como entregue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Todos os itens foram verificados com sucesso
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-notes">
              Observações da Entrega (Opcional)
            </Label>
            <Textarea
              id="delivery-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre a entrega, condições especiais, documentação entregue, etc."
              className="min-h-32"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleFinalize} disabled={isPending}>
            {isPending ? "Finalizando..." : "Confirmar Entrega"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
