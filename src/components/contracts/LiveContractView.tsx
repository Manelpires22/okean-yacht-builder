import { useLiveContract } from "@/hooks/useContracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, FileText, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";

interface LiveContractViewProps {
  contractId: string;
}

export function LiveContractView({ contractId }: LiveContractViewProps) {
  const { data: liveContract, isLoading } = useLiveContract(contractId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!liveContract) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Dados do contrato consolidado não disponíveis
        </CardContent>
      </Card>
    );
  }

  const priceVariation = liveContract.current_total_price - liveContract.base_price;
  const daysVariation = liveContract.current_total_delivery_days - liveContract.base_delivery_days;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Contrato Consolidado (Ao Vivo)
              </CardTitle>
              <CardDescription>
                Valores e prazos atualizados com todas as ATOs aprovadas
              </CardDescription>
            </div>
            <Badge variant="default" className="text-base px-4 py-2">
              {liveContract.approved_atos_count} ATO(s) aplicada(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Valor Total Consolidado</span>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(liveContract.current_total_price)}
                </p>
                {priceVariation !== 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span
                      className={
                        priceVariation > 0
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {priceVariation > 0 ? "+" : ""}
                      {formatCurrency(priceVariation)}
                    </span>{" "}
                    vs. contrato base
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Prazo Total Consolidado</span>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">
                  {liveContract.current_total_delivery_days} dias
                </p>
                {daysVariation !== 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-orange-600 font-semibold">
                      +{daysVariation} dias
                    </span>{" "}
                    vs. contrato base
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contrato Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(liveContract.base_price)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {liveContract.base_delivery_days} dias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Impacto ATOs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold">
                  {priceVariation > 0 ? "+" : ""}
                  {formatCurrency(liveContract.total_atos_price || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  +{liveContract.total_atos_delivery_days || 0} dias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status das ATOs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Aprovadas</span>
                <Badge variant="default">{liveContract.approved_atos_count}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pendentes</span>
                <Badge variant="secondary">{liveContract.pending_atos_count}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total</span>
                <Badge variant="outline">{liveContract.total_atos_count}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
