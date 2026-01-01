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
import { useState } from "react";

interface ExportCountryDialogProps {
  open: boolean;
  modelName: string;
  onConfirm: (isExporting: boolean, country: string | null) => void;
}

const EXPORT_COUNTRIES = [
  { value: "usa", label: "Estados Unidos (EUA)" },
  { value: "europa", label: "Europa" },
  { value: "canada", label: "Canadá" },
  { value: "australia", label: "Austrália" },
  { value: "outros", label: "Outros" },
];

export function ExportCountryDialog({
  open,
  modelName,
  onConfirm,
}: ExportCountryDialogProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleExport = () => {
    if (selectedCountry) {
      onConfirm(true, selectedCountry);
    }
  };

  const handleDomestic = () => {
    onConfirm(false, null);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Destino da Venda
          </DialogTitle>
          <DialogDescription>
            O modelo <strong>{modelName}</strong> é passível de exportação.
            <br />
            Selecione o destino da venda para aplicar as taxas corretas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">País de Exportação</label>
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
