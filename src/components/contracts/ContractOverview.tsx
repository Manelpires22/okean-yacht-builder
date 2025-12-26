import { Contract } from "@/hooks/useContracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Ship, User, Calendar, Hash, Users } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinkedCustomizationsCard } from "./LinkedCustomizationsCard";
import { useContractATOsAggregatedImpact } from "@/hooks/useContractATOsAggregatedImpact";
import { cn } from "@/lib/utils";

interface ContractOverviewProps {
  contract: Contract;
}

export function ContractOverview({ contract }: ContractOverviewProps) {
  // ✅ Usar hook de impacto agregado para valores corretos (deltas + MAX de dias)
  const { data: aggregatedImpact, isLoading: impactLoading } = 
    useContractATOsAggregatedImpact(contract.id);
  
  // Valores reais calculados com deltas e MAX
  const realATOsPrice = aggregatedImpact?.totalApprovedATOsPrice ?? 0;
  const realATOsDeliveryDays = aggregatedImpact?.maxApprovedATOsDeliveryDays ?? 0;
  const realTotalPrice = contract.base_price + realATOsPrice;
  const hasATOImpact = realATOsPrice !== 0 || realATOsDeliveryDays !== 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Contrato</CardTitle>
          <CardDescription>Dados gerais do contrato de construção</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Número do Contrato</p>
              <p className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {contract.contract_number}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Cotação Original</p>
              <p className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {contract.quotation?.quotation_number || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Modelo de Iate</p>
              <p className="font-semibold flex items-center gap-2">
                <Ship className="h-4 w-4" />
                {contract.yacht_model?.name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Cliente</p>
              <p className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                {contract.client?.name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Vendedor</p>
              <p className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                {contract.quotation?.sales_representative?.full_name || "N/A"}
              </p>
              {contract.quotation?.sales_representative?.email && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {contract.quotation.sales_representative.email}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Matrícula</p>
              <p className="font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4" />
                {contract.hull_number?.hull_number || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Entrega Prevista</p>
              <p className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {contract.hull_number?.estimated_delivery_date
                  ? format(
                      addDays(
                        new Date(contract.hull_number.estimated_delivery_date),
                        realATOsDeliveryDays
                      ),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )
                  : `${contract.current_total_delivery_days + realATOsDeliveryDays} dias`}
              </p>
              {realATOsDeliveryDays > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  (+{realATOsDeliveryDays} dias de ATOs)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valores e Prazos</CardTitle>
          <CardDescription>Consolidação de preços e prazos de entrega</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout: Base → ATOs → Total em cada coluna */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna VALORES */}
            <div className="space-y-6">
              {/* Preço Base */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Preço Base (Contrato Original)</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(contract.base_price)}
                </p>
              </div>

              {/* Valor Total ATOs */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Total em ATOs Aprovadas</p>
                {impactLoading ? (
                  <Skeleton className="h-8 w-40" />
                ) : hasATOImpact ? (
                  <>
                    <p className={cn(
                      "text-2xl font-semibold",
                      realATOsPrice < 0 ? "text-green-600" : "text-orange-600"
                    )}>
                      {realATOsPrice >= 0 ? "+ " : ""}{formatCurrency(realATOsPrice)}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {aggregatedImpact?.approvedATOsCount || 0} ATO(s) aprovada(s)
                    </Badge>
                  </>
                ) : (
                  <p className="text-2xl font-semibold text-muted-foreground">
                    R$ 0,00
                  </p>
                )}
              </div>

              <Separator />

              {/* Valor Total Atual */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Total Atual</p>
                {impactLoading ? (
                  <Skeleton className="h-10 w-48" />
                ) : (
                  <>
                    <p className="text-4xl font-bold text-primary">
                      {formatCurrency(realTotalPrice)}
                    </p>
                    {hasATOImpact && (
                      <p className={cn(
                        "text-sm mt-1",
                        realATOsPrice < 0 ? "text-green-600" : "text-muted-foreground"
                      )}>
                        Variação: {realATOsPrice >= 0 ? "+" : ""}{formatCurrency(realATOsPrice)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Coluna PRAZOS */}
            <div className="space-y-6">
              {/* Entrega Prevista (data do hull_number) */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Entrega Prevista</p>
                <p className="text-3xl font-bold text-primary">
                  {contract.hull_number?.estimated_delivery_date
                    ? format(new Date(contract.hull_number.estimated_delivery_date), "dd/MM/yyyy", { locale: ptBR })
                    : `${contract.base_delivery_days} dias`}
                </p>
              </div>

              {/* Impacto ATOs no Prazo */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Impacto ATOs no Prazo</p>
                {impactLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : realATOsDeliveryDays > 0 ? (
                  <p className="text-2xl font-semibold text-orange-600">
                    + {realATOsDeliveryDays} dias
                  </p>
                ) : (
                  <p className="text-2xl font-semibold text-muted-foreground">
                    0 dias
                  </p>
                )}
              </div>

              <Separator />

              {/* Data Ajustada (data base + impacto) */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data Ajustada</p>
                {impactLoading ? (
                  <Skeleton className="h-10 w-36" />
                ) : (
                  <>
                    <p className="text-4xl font-bold text-primary">
                      {contract.hull_number?.estimated_delivery_date
                        ? format(
                            addDays(
                              new Date(contract.hull_number.estimated_delivery_date),
                              realATOsDeliveryDays
                            ),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )
                        : `${contract.base_delivery_days + realATOsDeliveryDays} dias`}
                    </p>
                    {realATOsDeliveryDays > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Variação: +{realATOsDeliveryDays} dias
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinatura do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Data de Assinatura:</span>
            <span className="font-semibold">
              {contract.signed_at
                ? format(new Date(contract.signed_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })
                : "N/A"}
            </span>
          </div>

          {contract.signed_by_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Assinado por:</span>
              <span className="font-semibold">{contract.signed_by_name}</span>
            </div>
          )}

          {contract.signed_by_email && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="font-semibold">{contract.signed_by_email}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <LinkedCustomizationsCard 
        contractId={contract.id}
        quotationId={contract.quotation_id}
      />
    </div>
  );
}
