/**
 * Card de resumo da simulação MDC - Visível apenas para roles com permissão
 */

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/quotation-utils";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { userHasPermission } from "@/lib/role-permissions";

interface SimulationSummaryCardProps {
  simulationId: string | null | undefined;
}

export function SimulationSummaryCard({ simulationId }: SimulationSummaryCardProps) {
  const { data: userRoleData } = useUserRole();
  const userRoles = userRoleData?.roles || [];
  
  // Verificar permissão
  const canViewMDC = userHasPermission(userRoles, 'simulations:view_mdc');

  // Buscar dados da simulação
  const { data: simulation, isLoading } = useQuery({
    queryKey: ['simulation-summary', simulationId],
    queryFn: async () => {
      if (!simulationId) return null;
      
      const { data, error } = await supabase
        .from('simulations')
        .select('id, simulation_number, faturamento_liquido, margem_bruta, margem_percent, adjusted_commission_percent')
        .eq('id', simulationId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!simulationId && canViewMDC,
  });

  // Se não tem permissão ou não tem simulação, não renderizar
  if (!canViewMDC || !simulationId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!simulation) {
    return null;
  }

  // Determinar cor baseada na margem
  const getMarginColor = (percent: number) => {
    if (percent >= 25) return "text-green-600 dark:text-green-400";
    if (percent >= 15) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getMarginBgColor = (percent: number) => {
    if (percent >= 25) return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
    if (percent >= 15) return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800";
    return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
  };

  return (
    <Card className={cn("border", getMarginBgColor(simulation.margem_percent))}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5" />
          Análise de Margem (MDC)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Faturamento Líquido</p>
            <p className="text-lg font-semibold">
              {formatCurrency(simulation.faturamento_liquido)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Margem Bruta</p>
            <p className="text-lg font-semibold">
              {formatCurrency(simulation.margem_bruta)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">MDC</p>
            <p className={cn("text-2xl font-bold", getMarginColor(simulation.margem_percent))}>
              {simulation.margem_percent.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Comissão Ajustada</p>
            <p className="text-lg font-semibold">
              {simulation.adjusted_commission_percent?.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/simulacoes?id=${simulation.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Simulação Completa
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
