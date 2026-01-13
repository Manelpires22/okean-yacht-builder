import { useNavigate } from "react-router-dom";
import { CheckCircle, TrendingUp, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SimulatorPreloadData } from "@/types/simulator-preload";

interface QuotationSavedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  quotationNumber: string;
  simulatorData: SimulatorPreloadData;
}

export function QuotationSavedDialog({
  open,
  onOpenChange,
  quotationId,
  quotationNumber,
  simulatorData,
}: QuotationSavedDialogProps) {
  const navigate = useNavigate();

  const handleGoToQuotation = () => {
    onOpenChange(false);
    navigate(`/quotations/${quotationId}`);
  };

  const handleGoToSimulator = () => {
    onOpenChange(false);
    navigate('/simulacoes', { 
      state: { 
        preloadFromQuotation: simulatorData 
      } 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Cotação Salva!
          </DialogTitle>
          <DialogDescription>
            Cotação <span className="font-semibold text-foreground">{quotationNumber}</span> criada com sucesso.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center text-muted-foreground">
          Deseja analisar a margem de contribuição (MDC) desta negociação no simulador?
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleGoToQuotation}
            className="w-full sm:w-auto"
          >
            <FileText className="mr-2 h-4 w-4" />
            Ver Cotação
          </Button>
          <Button 
            onClick={handleGoToSimulator}
            className="w-full sm:w-auto"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Analisar Margem (MDC)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
