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

export type ExportCurrency = 'USD' | 'EUR';

interface ExportCountryDialogProps {
  open: boolean;
  modelName: string;
  onConfirm: (isExporting: boolean, country: string | null, currency: ExportCurrency | null) => void;
}

const EXPORT_COUNTRIES = [
  { value: "usa", label: "Estados Unidos (EUA)" },
  { value: "europa", label: "Europa" },
  { value: "canada", label: "Canadá" },
  { value: "australia", label: "Austrália" },
  { value: "outros", label: "Outros" },
];

// Moeda fixa por país (null = usuário escolhe)
const COUNTRY_CURRENCIES: Record<string, ExportCurrency | null> = {
  usa: 'USD',
  europa: 'EUR',
  canada: null,
  australia: null,
  outros: null,
};

export function ExportCountryDialog({
  open,
  modelName,
  onConfirm,
}: ExportCountryDialogProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<ExportCurrency>('USD');

  // Quando país muda, atualizar moeda automaticamente se fixa
  useEffect(() => {
    if (selectedCountry) {
      const fixedCurrency = COUNTRY_CURRENCIES[selectedCountry];
      if (fixedCurrency) {
        setSelectedCurrency(fixedCurrency);
      }
    }
  }, [selectedCountry]);

  const handleExport = () => {
    if (selectedCountry) {
      onConfirm(true, selectedCountry, selectedCurrency);
    }
  };

  const handleDomestic = () => {
    onConfirm(false, null, null);
  };

  // Verifica se o país selecionado tem moeda fixa
  const hasFixedCurrency = selectedCountry ? COUNTRY_CURRENCIES[selectedCountry] !== null : true;
  const fixedCurrencyLabel = selectedCountry && COUNTRY_CURRENCIES[selectedCountry] 
    ? (COUNTRY_CURRENCIES[selectedCountry] === 'USD' ? 'Dólar (USD)' : 'Euro (EUR)')
    : null;

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
            <Label>País de Exportação</Label>
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

          {/* Seletor de moeda - apenas quando país não tem moeda fixa */}
          {selectedCountry && !hasFixedCurrency && (
            <div className="space-y-2">
              <Label>Moeda de Faturamento</Label>
              <Select value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as ExportCurrency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">Dólar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mostrar moeda fixa como informação */}
          {selectedCountry && hasFixedCurrency && fixedCurrencyLabel && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              Moeda: <strong>{fixedCurrencyLabel}</strong>
            </div>
          )}

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