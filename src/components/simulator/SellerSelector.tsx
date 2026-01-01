import { User, Users, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const TYPE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType }> = {
  venda_interna: { label: "Interno", variant: "default", icon: User },
  broker_interno: { label: "Broker", variant: "secondary", icon: Users },
  sub_dealer: { label: "Sub-Dealer", variant: "outline", icon: Building2 },
};

export function SellerSelector({ onSelect }: SellerSelectorProps) {
  const { data: commissions, isLoading } = useSimulatorCommissions();

  const activeCommissions = commissions?.filter(c => c.is_active) || [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Simulador de Viabilidade" />
      
      <div className="container mx-auto p-6 max-w-4xl">
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
            Selecione o vendedor para aplicar a comissão correta na simulação
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : activeCommissions.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum vendedor cadastrado</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre comissões em Administração → Simulador → Comissões
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCommissions.map((commission) => {
              const config = TYPE_CONFIG[commission.type] || TYPE_CONFIG.venda_interna;
              const Icon = config.icon;
              
              return (
                <Card
                  key={commission.id}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md group"
                  onClick={() => onSelect({
                    id: commission.id,
                    name: commission.name,
                    percent: commission.percent || 0,
                    type: commission.type,
                  })}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10">
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{commission.name}</h3>
                    <p className="text-2xl font-bold text-primary">
                      {commission.percent || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Comissão sobre venda
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
