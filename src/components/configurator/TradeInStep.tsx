import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/numeric-input";
import { ArrowLeft, ArrowRight, User, Ship, Settings, Users, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TradeInData {
  hasTradeIn: boolean;
  tradeInBrand: string;
  tradeInModel: string;
  tradeInYear: number | null;
  tradeInEntryValue: number;
  tradeInRealValue: number;
}

interface TradeInStepProps {
  commissionName: string;
  clientName: string;
  onConfirm: (data: TradeInData) => void;
  onBack: () => void;
}

interface StepIndicatorProps {
  step: number;
  label: string;
  active?: boolean;
  completed?: boolean;
  icon: React.ReactNode;
}

function StepIndicator({ step, label, active, completed, icon }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
          active && "bg-primary text-primary-foreground",
          completed && "bg-primary/20 text-primary",
          !active && !completed && "bg-muted text-muted-foreground"
        )}
      >
        {completed ? "✓" : icon}
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          active && "text-foreground",
          !active && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function TradeInStep({ commissionName, clientName, onConfirm, onBack }: TradeInStepProps) {
  const [showForm, setShowForm] = useState(false);
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
  };

  const isFormValid = brand.trim() && model.trim() && parseFloat(entryValue) > 0 && parseFloat(realValue) > 0;
  const depreciation = parseFloat(entryValue) - parseFloat(realValue);

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      {/* Botão Voltar */}
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
        <StepIndicator step={1} label="Vendedor" completed icon={<User className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator step={2} label="Cliente" completed icon={<Users className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator step={3} label="Trade-In" active icon={<Repeat className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator step={4} label="Modelo" icon={<Ship className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <StepIndicator step={5} label="Config" icon={<Settings className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <Repeat className="h-5 w-5" />
            Trade-In de Barco Usado
          </CardTitle>
          <CardDescription>
            Vendedor: <span className="font-medium text-foreground">{commissionName}</span>
            {" • "}
            Cliente: <span className="font-medium text-foreground">{clientName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForm ? (
            <div className="py-6 space-y-4">
              <p className="text-center text-muted-foreground">
                Esta venda envolve trade-in de barco usado?
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleNoTradeIn} className="w-32">
                  Não
                </Button>
                <Button onClick={() => setShowForm(true)} className="w-32">
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
                <div className={cn(
                  "p-3 rounded-lg",
                  depreciation > 0 
                    ? "bg-destructive/10 border border-destructive/20" 
                    : "bg-green-500/10 border border-green-500/20"
                )}>
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

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleNoTradeIn} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmTradeIn} disabled={!isFormValid} className="flex-1 gap-2">
                  Confirmar Trade-In
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
