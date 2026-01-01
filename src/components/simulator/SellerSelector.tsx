import { ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulatorCommissions } from "@/hooks/useSimulatorConfig";
import { AppHeader } from "@/components/AppHeader";

interface SellerSelectorProps {
  onSelect: (commission: {
    id: string;
    name: string;
    percent: number;
    type: string;
  }) => void;
}

export function SellerSelector({ onSelect }: SellerSelectorProps) {
  const { data: commissions, isLoading } = useSimulatorCommissions();

  const activeCommissions = commissions?.filter(c => c.is_active) || [];

  const handleSelect = (commissionId: string) => {
    const commission = activeCommissions.find(c => c.id === commissionId);
    if (commission) {
      onSelect({
        id: commission.id,
        name: commission.name,
        percent: commission.percent || 0,
        type: commission.type,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Simulador de Viabilidade" />
      
      <div className="container mx-auto p-6 max-w-md">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="font-medium">Vendedor</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-muted-foreground">Modelo</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Quem está vendendo?</h1>
          <p className="text-muted-foreground">
            Selecione o vendedor para aplicar a comissão correta
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : activeCommissions.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">
              Nenhum vendedor cadastrado
            </p>
          </div>
        ) : (
          <Select onValueChange={handleSelect}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Selecione um vendedor" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {activeCommissions.map((commission) => (
                <SelectItem key={commission.id} value={commission.id}>
                  {commission.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
