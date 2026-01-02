import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/numeric-input";
import { Ship, ArrowRight } from "lucide-react";

export interface TradeInData {
  hasTradeIn: boolean;
  tradeInBrand: string;
  tradeInModel: string;
  tradeInYear: number | null;
  tradeInEntryValue: number;
  tradeInRealValue: number;
}

interface TradeInDialogProps {
  open: boolean;
  modelName: string;
  onConfirm: (data: TradeInData) => void;
}

export function TradeInDialog({ open, modelName, onConfirm }: TradeInDialogProps) {
  const [hasTradeIn, setHasTradeIn] = useState<boolean | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [entryValue, setEntryValue] = useState("0");
  const [realValue, setRealValue] = useState("0");

  const handleNoTradeIn = () => {
    onConfirm({
      hasTradeIn: false,
      tradeInBrand: "",
      tradeInModel: "",
      tradeInYear: null,
      tradeInEntryValue: 0,
      tradeInRealValue: 0,
    });
    resetForm();
  };

  const handleConfirmTradeIn = () => {
    onConfirm({
      hasTradeIn: true,
      tradeInBrand: brand,
      tradeInModel: model,
      tradeInYear: year ? parseInt(year) : null,
      tradeInEntryValue: parseFloat(entryValue) || 0,
      tradeInRealValue: parseFloat(realValue) || 0,
    });
    resetForm();
  };

  const resetForm = () => {
    setHasTradeIn(null);
    setBrand("");
    setModel("");
    setYear("");
    setEntryValue("0");
    setRealValue("0");
  };

  const isFormValid = brand.trim() && model.trim() && parseFloat(entryValue) > 0 && parseFloat(realValue) > 0;

  const depreciation = parseFloat(entryValue) - parseFloat(realValue);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Trade-In de Barco Usado
          </DialogTitle>
          <DialogDescription>
            Simulação para: <strong>{modelName}</strong>
          </DialogDescription>
        </DialogHeader>

        {hasTradeIn === null ? (
          <div className="py-6 space-y-4">
            <p className="text-center text-muted-foreground">
              Esta venda envolve trade-in de barco usado?
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleNoTradeIn} className="w-32">
                Não
              </Button>
              <Button onClick={() => setHasTradeIn(true)} className="w-32">
                Sim
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  placeholder="Ex: Ferretti Yachts"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Ex: FY720"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                placeholder="Ex: 2020"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={1990}
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entryValue">Valor de Entrada</Label>
                <CurrencyInput
                  id="entryValue"
                  value={entryValue}
                  onChange={setEntryValue}
                  placeholder="Valor aceito na troca"
                />
                <p className="text-xs text-muted-foreground">
                  Quanto será aceito na troca
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="realValue">Valor Real de Venda</Label>
                <CurrencyInput
                  id="realValue"
                  value={realValue}
                  onChange={setRealValue}
                  placeholder="Valor real de mercado"
                />
                <p className="text-xs text-muted-foreground">
                  Valor real de mercado
                </p>
              </div>
            </div>

            {parseFloat(entryValue) > 0 && parseFloat(realValue) > 0 && (
              <div className={`p-3 rounded-lg ${depreciation > 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                <p className="text-sm font-medium">
                  Depreciação: {depreciation > 0 ? '-' : '+'}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Math.abs(depreciation))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {depreciation > 0 
                    ? "Este valor será absorvido na margem" 
                    : "Valor de entrada menor que o real (lucro no usado)"}
                </p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleNoTradeIn}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmTradeIn} disabled={!isFormValid} className="gap-2">
                Confirmar Trade-In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
