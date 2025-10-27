import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, FileSignature } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useConvertCustomizationToATO } from "@/hooks/useConvertCustomizationToATO";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConvertCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customization: any;
  contractId: string;
}

export function ConvertCustomizationDialog({
  open,
  onOpenChange,
  customization,
  contractId,
}: ConvertCustomizationDialogProps) {
  const { mutate: convert, isPending } = useConvertCustomizationToATO();

  const handleConvert = () => {
    convert(
      {
        customizationId: customization.id,
        contractId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!customization) return null;

  const canConvert = customization.status === "approved" && !customization.ato_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Converter Customização em ATO
          </DialogTitle>
          <DialogDescription>
            Criar um ATO (Additional To Order) a partir desta customização aprovada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!canConvert && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {customization.ato_id
                  ? "Esta customização já foi convertida em ATO"
                  : "Apenas customizações aprovadas podem ser convertidas em ATOs"}
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{customization.item_name}</h3>
              <Badge
                variant={
                  customization.status === "approved"
                    ? "default"
                    : customization.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {customization.status === "approved"
                  ? "Aprovado"
                  : customization.status === "rejected"
                  ? "Rejeitado"
                  : "Pendente"}
              </Badge>
            </div>

            {customization.pm_scope && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escopo:</p>
                <p className="text-sm">{customization.pm_scope}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custo Adicional</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(customization.additional_cost || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Impacto no Prazo</p>
                <p className="text-lg font-bold text-orange-600">
                  +{customization.delivery_impact_days || 0} dias
                </p>
              </div>
            </div>

            {customization.engineering_hours > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Horas de Engenharia</p>
                <p className="text-sm">{customization.engineering_hours}h</p>
              </div>
            )}
          </div>

          {canConvert && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">Customização Aprovada</p>
                  <p className="text-xs text-muted-foreground">Status atual</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">ATO (Rascunho)</p>
                  <p className="text-xs text-muted-foreground">Será criado no contrato</p>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  O ATO será criado em rascunho e precisará de aprovação comercial antes de
                  impactar o contrato. Os valores de custo e prazo serão transferidos
                  automaticamente.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConvert} disabled={!canConvert || isPending}>
            {isPending ? "Convertendo..." : "Converter em ATO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
