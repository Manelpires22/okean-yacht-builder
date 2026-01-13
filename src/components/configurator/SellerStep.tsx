import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, User, Ship, Settings } from "lucide-react";
import { useSimulatorCommissions } from "@/hooks/useSimulatorConfig";
import { cn } from "@/lib/utils";
import type { CommissionData } from "@/hooks/useConfigurationState";

interface SellerStepProps {
  onSelect: (commission: CommissionData) => void;
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
        {icon}
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

export function SellerStep({ onSelect, onBack }: SellerStepProps) {
  const { data: commissions, isLoading } = useSimulatorCommissions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const activeCommissions = commissions?.filter(c => c.is_active) || [];
  
  const selectedCommission = activeCommissions.find(c => c.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleContinue = () => {
    if (selectedCommission) {
      onSelect({
        id: selectedCommission.id,
        name: selectedCommission.name,
        percent: selectedCommission.percent,
        type: selectedCommission.type,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Botão Voltar */}
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Home
      </Button>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <StepIndicator step={1} label="Vendedor" active icon={<User className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator step={2} label="Modelo" icon={<Ship className="h-5 w-5" />} />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator step={3} label="Configuração" icon={<Settings className="h-5 w-5" />} />
      </div>

      {/* Card de Seleção */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Quem está vendendo?</CardTitle>
          <CardDescription>
            Selecione o vendedor para aplicar a comissão correta na simulação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : activeCommissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum vendedor cadastrado. Entre em contato com o administrador.
            </p>
          ) : (
            <>
              <Select value={selectedId || undefined} onValueChange={handleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeCommissions.map((commission) => (
                    <SelectItem key={commission.id} value={commission.id}>
                      {commission.name} ({commission.percent}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCommission && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm font-medium">{selectedCommission.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Comissão: {selectedCommission.percent}% • {selectedCommission.type}
                  </p>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleContinue}
                disabled={!selectedCommission}
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
