import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import type { SaleType } from "@/lib/pricing-markup";

interface SaleTypeDialogProps {
  open: boolean;
  modelName: string;
  onConfirm: (saleType: SaleType, exportCountry: string | null) => void;
}

const EXPORT_COUNTRIES = [
  { value: "usa", label: "Estados Unidos (EUA)" },
  { value: "europa", label: "Europa" },
  { value: "canada", label: "Canadá" },
  { value: "australia", label: "Austrália" },
  { value: "outros", label: "Outros" },
];

export function SaleTypeDialog({
  open,
  modelName,
  onConfirm,
}: SaleTypeDialogProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Reset quando o dialog abre
  useEffect(() => {
    if (open) {
      setSelectedCountry(null);
    }
  }, [open]);

  const handleExport = () => {
    if (selectedCountry) {
      onConfirm('export', selectedCountry);
    }
  };

  const handleDomestic = () => {
    onConfirm('national', null);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Tipo de Venda
          </DialogTitle>
          <DialogDescription>
            O modelo <strong>{modelName}</strong> é passível de exportação.
            <br />
            <br />
            O tipo de venda afeta os preços dos opcionais e upgrades, pois altera
            os impostos e garantia aplicados no cálculo de markup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium">Diferença de Taxas:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Nacional</p>
                <ul className="text-xs space-y-1">
                  <li>• Impostos: 19,89%</li>
                  <li>• Garantia: 3%</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Exportação</p>
                <ul className="text-xs space-y-1">
                  <li>• Impostos: 0%</li>
                  <li>• Garantia: 5%</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>País de Exportação (opcional)</Label>
            <Select value={selectedCountry || ""} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o país..." />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleExport}
              disabled={!selectedCountry}
              className="w-full"
            >
              <Globe className="h-4 w-4 mr-2" />
              Confirmar Exportação
            </Button>
            <Button
              variant="outline"
              onClick={handleDomestic}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Venda Nacional
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
