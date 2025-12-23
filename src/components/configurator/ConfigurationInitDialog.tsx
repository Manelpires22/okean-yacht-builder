import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HullNumberSelector } from "./HullNumberSelector";
import { HullNumber } from "@/hooks/useHullNumbers";
import { Ship } from "lucide-react";

interface ConfigurationInitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yachtModelId: string;
  yachtModelName: string;
  onConfirm: (hullNumber: HullNumber) => void;
}

export function ConfigurationInitDialog({
  open,
  onOpenChange,
  yachtModelId,
  yachtModelName,
  onConfirm,
}: ConfigurationInitDialogProps) {
  const [selectedHullNumber, setSelectedHullNumber] = useState<HullNumber | null>(null);

  const handleConfirm = () => {
    if (selectedHullNumber) {
      onConfirm(selectedHullNumber);
      setSelectedHullNumber(null);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedHullNumber(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Iniciar Configuração
          </DialogTitle>
          <DialogDescription>
            Selecione a matrícula disponível para configurar o modelo <strong>{yachtModelName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <HullNumberSelector
            yachtModelId={yachtModelId}
            selectedHullNumberId={selectedHullNumber?.id || null}
            onSelect={setSelectedHullNumber}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedHullNumber}>
            Iniciar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
