import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Ship, Anchor, AlertCircle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAvailableHullNumbers, HullNumber } from "@/hooks/useHullNumbers";

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
    return <Skeleton className="h-10 w-full max-w-sm" />;
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
          Não há matrículas disponíveis para este modelo.
        </AlertDescription>
      </Alert>
    );
  }

  const selectedHull = hullNumbers.find(h => h.id === selectedHullNumberId);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Matrícula</label>
      <Select
        value={selectedHullNumberId || ""}
        onValueChange={(value) => {
          const selected = hullNumbers.find(h => h.id === value);
          if (selected) onSelect(selected);
        }}
      >
        <SelectTrigger className="w-full max-w-md bg-background">
          <SelectValue placeholder="Selecione a matrícula...">
            {selectedHull && (
              <div className="flex items-center gap-2">
                <Anchor className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {selectedHull.brand} {selectedHull.hull_number}
                </span>
                <span className="text-muted-foreground text-xs">
                  — Entrega: {formatDate(selectedHull.estimated_delivery_date)}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {hullNumbers.map((hull) => (
            <SelectItem key={hull.id} value={hull.id} className="py-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Anchor className="h-4 w-4 text-primary" />
                  <span className="font-bold">
                    {hull.brand} {hull.hull_number}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Ship className="h-3 w-3" />
                    {formatDate(hull.hull_entry_date)}
                  </span>
                  <span className="flex items-center gap-1 text-success">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(hull.estimated_delivery_date)}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedHull && (
        <p className="text-xs text-muted-foreground">
          {hullNumbers.length} matrícula(s) disponível(is) para este modelo
        </p>
      )}
    </div>
  );
}
