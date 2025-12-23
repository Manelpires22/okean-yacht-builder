import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Ship, Anchor, AlertCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailableHullNumbers, HullNumber } from "@/hooks/useHullNumbers";
import { cn } from "@/lib/utils";

interface HullNumberSelectorProps {
  yachtModelId: string;
  selectedHullNumberId: string | null;
  onSelect: (hullNumber: HullNumber) => void;
}

export function HullNumberSelector({
  yachtModelId,
  selectedHullNumberId,
  onSelect,
}: HullNumberSelectorProps) {
  const { data: hullNumbers, isLoading, error } = useAvailableHullNumbers(yachtModelId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar matrículas disponíveis.
        </AlertDescription>
      </Alert>
    );
  }

  if (!hullNumbers || hullNumbers.length === 0) {
    return (
      <Alert>
        <Ship className="h-4 w-4" />
        <AlertDescription>
          Não há matrículas disponíveis para este modelo. Entre em contato com o administrador.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Selecione a matrícula para esta configuração:
      </div>

      <RadioGroup
        value={selectedHullNumberId || ""}
        onValueChange={(value) => {
          const selected = hullNumbers.find(h => h.id === value);
          if (selected) onSelect(selected);
        }}
        className="space-y-3"
      >
        {hullNumbers.map((hull) => (
          <Label
            key={hull.id}
            htmlFor={hull.id}
            className="cursor-pointer"
          >
            <Card className={cn(
              "transition-all hover:border-primary/50",
              selectedHullNumberId === hull.id && "border-primary bg-primary/5"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <RadioGroupItem value={hull.id} id={hull.id} />
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Matrícula */}
                    <div className="flex items-center gap-2">
                      <Anchor className="h-4 w-4 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Matrícula</div>
                        <div className="font-bold text-lg">{hull.brand} {hull.hull_number}</div>
                      </div>
                    </div>

                    {/* Data Entrada Casco */}
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Entrada Casco</div>
                        <div className="font-medium">
                          {format(new Date(hull.hull_entry_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {/* Data Prevista Entrega */}
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-success" />
                      <div>
                        <div className="text-xs text-muted-foreground">Entrega Prevista</div>
                        <div className="font-medium text-success">
                          {format(new Date(hull.estimated_delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
