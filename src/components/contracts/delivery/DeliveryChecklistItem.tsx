import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DeliveryChecklistItem as ChecklistItem } from "@/hooks/useContractDeliveryChecklist";
import { useUpdateDeliveryItem } from "@/hooks/useUpdateDeliveryItem";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Edit, Save, X } from "lucide-react";

interface DeliveryChecklistItemProps {
  item: ChecklistItem;
}

export function DeliveryChecklistItemComponent({ item }: DeliveryChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(item.verification_notes || "");
  const { mutate: updateItem, isPending } = useUpdateDeliveryItem();

  const handleToggleVerified = () => {
    updateItem({
      itemId: item.id,
      isVerified: !item.is_verified,
      verificationNotes: notes,
    });
  };

  const handleSaveNotes = () => {
    updateItem(
      {
        itemId: item.id,
        isVerified: item.is_verified,
        verificationNotes: notes,
      },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={item.is_verified}
          onCheckedChange={handleToggleVerified}
          disabled={isPending}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium">
                {item.item_name}
              </p>
              {item.item_code && (
                <p className="text-sm text-muted-foreground">
                  Código: {item.item_code}
                </p>
              )}
            </div>
            
            {item.is_verified && (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
          </div>

          {item.is_verified && item.verified_at && (
            <p className="text-xs text-muted-foreground mt-1">
              ✓ Verificado em {format(new Date(item.verified_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}

          {/* Notas de verificação */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a verificação..."
                className="min-h-20"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isPending}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNotes(item.verification_notes || "");
                    setIsEditing(false);
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {item.verification_notes && (
                <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                  {item.verification_notes}
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="mt-2 h-7 px-2"
              >
                <Edit className="h-3 w-3 mr-1" />
                {item.verification_notes ? "Editar" : "Adicionar"} observações
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
