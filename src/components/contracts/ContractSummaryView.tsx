import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContract, useLiveContract } from "@/hooks/useContracts";
import { useContractATOsAggregatedImpact } from "@/hooks/useContractATOsAggregatedImpact";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractSummaryViewProps {
  contractId: string;
}

export function ContractSummaryView({ contractId }: ContractSummaryViewProps) {
  const { data: contract, isLoading: isLoadingContract } = useContract(contractId);
  const { data: liveContract, isLoading: isLoadingLive } = useLiveContract(contractId);
  const { data: atosImpact, isLoading: isLoadingATOs } = useContractATOsAggregatedImpact(contractId);

  const isLoading = isLoadingContract || isLoadingLive || isLoadingATOs;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contrato não encontrado</p>
      </div>
    );
  }

  const yachtModel = contract.yacht_model;
  const baseSnapshot = contract.base_snapshot as any;
  
  // Extrair valores do snapshot base
  const basePrice = contract.base_price || 0;
  const upgradesPrice = baseSnapshot?.total_upgrades_price || 0;
  const optionsPrice = baseSnapshot?.total_options_price || 0;
  const customizationsPrice = baseSnapshot?.total_customizations_price || 0;
  const discountAmount = baseSnapshot?.discount_amount || 0;
  
  // ATOs aprovadas
  const atosPrice = atosImpact?.totalApprovedATOsPrice || 0;
  const atosCount = atosImpact?.approvedATOsCount || 0;
  
  // Cálculos finais
  const valorInicial = basePrice + upgradesPrice + optionsPrice + customizationsPrice;
  const valorComATOs = valorInicial + atosPrice;
  const finalPrice = liveContract?.current_total_price || contract.current_total_price || valorComATOs - discountAmount;
  const savings = discountAmount;
  
  // Delivery
  const baseDeliveryDays = contract.base_delivery_days;
  const totalDeliveryDays = liveContract?.current_total_delivery_days || contract.current_total_delivery_days;
  const hullNumber = contract.hull_number?.hull_number;
  const estimatedDeliveryDate = contract.hull_number?.estimated_delivery_date;

  return (
    <div className="space-y-6">
      {/* Título da Seção */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Resumo do Contrato
        </h1>
        <p className="text-muted-foreground mt-1">
          Configuração completa e valores da embarcação contratada
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modelo do Iate */}
        <Card className="overflow-hidden">
          <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-primary/10 to-primary/5">
            {yachtModel?.image_url && (
              <img
                src={yachtModel.image_url}
                alt={yachtModel.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">{yachtModel?.name}</h3>
              {yachtModel?.code && (
                <p className="text-sm opacity-90">Código: {yachtModel.code}</p>
              )}
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{yachtModel?.name}</h2>
                <p className="text-sm text-muted-foreground">Código: {yachtModel?.code}</p>
                {yachtModel?.description && (
                  <p className="text-sm mt-2 line-clamp-2">{yachtModel.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro Destacado */}
        <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
          <CardContent className="p-6 space-y-6">
            {/* Prazo de Entrega */}
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {estimatedDeliveryDate ? "Entrega Prevista" : "Prazo de Entrega"}
              </p>
              <p className="text-2xl font-bold">
                {estimatedDeliveryDate 
                  ? format(new Date(estimatedDeliveryDate), "dd/MM/yyyy", { locale: ptBR })
                  : formatDays(totalDeliveryDays)}
              </p>
              {hullNumber && (
                <p className="text-sm text-muted-foreground mt-1">
                  Matrícula: {hullNumber}
                </p>
              )}
              {!estimatedDeliveryDate && totalDeliveryDays > baseDeliveryDays && (
                <p className="text-sm text-muted-foreground mt-1">
                  Base: {formatDays(baseDeliveryDays)} (+{totalDeliveryDays - baseDeliveryDays} dias adicionais)
                </p>
              )}
            </div>

            {/* Breakdown Financeiro Detalhado */}
            <div className="pt-4 border-t space-y-3 text-sm">
              {/* Composição do Contrato */}
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Composição do Contrato
              </p>
              
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barco Base</span>
                  <span className="font-medium">{formatCurrency(basePrice)}</span>
                </div>
                {upgradesPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upgrades</span>
                    <span className="font-medium">{formatCurrency(upgradesPrice)}</span>
                  </div>
                )}
                {optionsPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opcionais</span>
                    <span className="font-medium">{formatCurrency(optionsPrice)}</span>
                  </div>
                )}
                {customizationsPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customizações</span>
                    <span className="font-medium">{formatCurrency(customizationsPrice)}</span>
                  </div>
                )}
                {/* ATOs Aprovadas - NOVO */}
                {atosPrice !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ATOs Aprovadas ({atosCount})
                    </span>
                    <span className={`font-medium ${atosPrice >= 0 ? '' : 'text-green-600'}`}>
                      {atosPrice >= 0 ? formatCurrency(atosPrice) : `-${formatCurrency(Math.abs(atosPrice))}`}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Valor Inicial */}
              <div className="flex justify-between pt-2 border-t border-dashed">
                <span className="font-medium">Valor Inicial</span>
                <span className="font-semibold">{formatCurrency(valorInicial)}</span>
              </div>
              
              {/* ATOs como delta separado se houver */}
              {atosPrice !== 0 && (
                <div className={`flex justify-between ${atosPrice >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  <span>Impacto ATOs</span>
                  <span className="font-medium">
                    {atosPrice >= 0 ? `+${formatCurrency(atosPrice)}` : `-${formatCurrency(Math.abs(atosPrice))}`}
                  </span>
                </div>
              )}
              
              {/* Descontos */}
              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descontos aplicados</span>
                  <span className="font-medium">-{formatCurrency(savings)}</span>
                </div>
              )}
              
              {/* Valor Final do Contrato */}
              <div className="flex justify-between pt-3 border-t mt-2">
                <span className="font-semibold text-base">Valor Final do Contrato</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(finalPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
