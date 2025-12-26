import { useState } from "react";
import { useLiveContract, useContract } from "@/hooks/useContracts";
import { useConsolidatedContractScope } from "@/hooks/useConsolidatedContractScope";
import { useContractATOsAggregatedImpact } from "@/hooks/useContractATOsAggregatedImpact";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BookOpen, Package, Wrench, Settings, ArrowUpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContractMemorialView } from "./scope/ContractMemorialView";
import { ContractOptionsView } from "./scope/ContractOptionsView";
import { ContractUpgradesView } from "./scope/ContractUpgradesView";
import { ContractCustomizationsView } from "./scope/ContractCustomizationsView";
import { ContractATODefinitionsView } from "./scope/ContractATODefinitionsView";
import { ATODetailDialog } from "./ATODetailDialog";

interface LiveContractViewProps {
  contractId: string;
}

export function LiveContractView({ contractId }: LiveContractViewProps) {
  const { data: liveContract, isLoading: liveLoading } = useLiveContract(contractId);
  const { data: contract, isLoading: contractLoading } = useContract(contractId);
  const { data: scopeData, isLoading: scopeLoading } = useConsolidatedContractScope(contractId);
  const { data: aggregatedImpact, isLoading: impactLoading } = useContractATOsAggregatedImpact(contractId);
  const [selectedATOId, setSelectedATOId] = useState<string | null>(null);
  const [showATODialog, setShowATODialog] = useState(false);

  const isLoading = liveLoading || scopeLoading || contractLoading;

  const handleATOClick = (atoId: string) => {
    setSelectedATOId(atoId);
    setShowATODialog(true);
  };

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

  // ✅ Usar valores do hook de impacto agregado (com deltas e MAX)
  const realATOsPrice = aggregatedImpact?.totalApprovedATOsPrice ?? liveContract.total_atos_price ?? 0;
  const realATOsDeliveryDays = aggregatedImpact?.maxApprovedATOsDeliveryDays ?? liveContract.total_atos_delivery_days ?? 0;
  
  const realTotalPrice = liveContract.base_price + realATOsPrice;
  const realTotalDeliveryDays = liveContract.base_delivery_days + realATOsDeliveryDays;
  
  const priceVariation = realATOsPrice;
  const daysVariation = realATOsDeliveryDays;

  return (
    <>
    <Tabs defaultValue="resumo" className="space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="resumo" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Resumo
        </TabsTrigger>
        <TabsTrigger value="memorial" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Memorial
        </TabsTrigger>
        <TabsTrigger value="upgrades" className="gap-2">
          <ArrowUpCircle className="h-4 w-4" />
          Upgrades
        </TabsTrigger>
        <TabsTrigger value="opcionais" className="gap-2">
          <Package className="h-4 w-4" />
          Opcionais
        </TabsTrigger>
        <TabsTrigger value="customizacoes" className="gap-2">
          <Wrench className="h-4 w-4" />
          Customizações
        </TabsTrigger>
        <TabsTrigger value="atos" className="gap-2">
          <Settings className="h-4 w-4" />
          ATOs
        </TabsTrigger>
      </TabsList>

      {/* Tab: Resumo Financeiro */}
      <TabsContent value="resumo" className="space-y-6">
        {/* Card: Valores e Prazos Consolidados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Valores e Prazos
            </CardTitle>
            <CardDescription>Consolidação de preços e prazos de entrega</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Coluna VALORES */}
              <div className="space-y-6">
                {/* 1. Contrato Original */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Preço Base (Contrato Original)</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(liveContract.base_price)}
                  </p>
                </div>
                
                {/* 2. Valor ATOs */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Impacto ATOs Aprovadas</p>
                  {impactLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <p className={`text-2xl font-semibold ${realATOsPrice < 0 ? "text-green-600" : realATOsPrice > 0 ? "text-orange-600" : ""}`}>
                      {realATOsPrice >= 0 ? "+" : ""}{formatCurrency(realATOsPrice)}
                    </p>
                  )}
                  <Badge className="mt-2" variant="secondary">
                    {liveContract.approved_atos_count} ATO(s) aprovada(s)
                  </Badge>
                </div>
                
                {/* Separador visual */}
                <Separator className="my-4" />
                
                {/* 3. Total Consolidado */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Valor Total Atual</p>
                  {impactLoading ? (
                    <Skeleton className="h-10 w-40" />
                  ) : (
                    <p className="text-4xl font-bold text-primary">
                      {formatCurrency(realTotalPrice)}
                    </p>
                  )}
                  {priceVariation !== 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Variação:{" "}
                      <span className={priceVariation < 0 ? "text-green-600 font-semibold" : "text-orange-600 font-semibold"}>
                        {priceVariation >= 0 ? "+" : ""}{formatCurrency(priceVariation)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Coluna PRAZOS */}
              <div className="space-y-6">
                {/* 1. Entrega Prevista (data do hull_number) */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Entrega Prevista</p>
                  <p className="text-3xl font-bold text-primary">
                    {contract?.hull_number?.estimated_delivery_date
                      ? format(new Date(contract.hull_number.estimated_delivery_date), "dd/MM/yyyy", { locale: ptBR })
                      : `${liveContract.base_delivery_days} dias`}
                  </p>
                </div>
                
                {/* 2. Impacto ATOs */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Impacto ATOs no Prazo</p>
                  {impactLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-semibold text-orange-600">
                      +{realATOsDeliveryDays} dias
                    </p>
                  )}
                </div>
                
                {/* Separador visual */}
                <Separator className="my-4" />
                
                {/* 3. Data Ajustada (data base + impacto) */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Data Ajustada</p>
                  {impactLoading ? (
                    <Skeleton className="h-10 w-32" />
                  ) : (
                    <p className="text-4xl font-bold text-primary">
                      {contract?.hull_number?.estimated_delivery_date
                        ? format(
                            addDays(
                              new Date(contract.hull_number.estimated_delivery_date),
                              daysVariation
                            ),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )
                        : `${realTotalDeliveryDays} dias`}
                    </p>
                  )}
                  {daysVariation > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Variação:{" "}
                      <span className="text-orange-600 font-semibold">
                        +{daysVariation} dias
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Status das ATOs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status das ATOs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Aprovadas</span>
                <Badge variant="default" className="text-base px-4 py-1">
                  {liveContract.approved_atos_count}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <Badge variant="secondary" className="text-base px-4 py-1">
                  {liveContract.pending_atos_count}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <Badge variant="outline" className="text-base px-4 py-1">
                  {liveContract.total_atos_count}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab: Memorial Base */}
      <TabsContent value="memorial">
        <ContractMemorialView items={scopeData?.memorialItems || []} />
      </TabsContent>

      {/* Tab: Upgrades */}
      <TabsContent value="upgrades">
        <ContractUpgradesView upgrades={scopeData?.selectedUpgrades || []} />
      </TabsContent>

      {/* Tab: Opcionais Contratados */}
      <TabsContent value="opcionais">
        <ContractOptionsView options={scopeData?.selectedOptions || []} />
      </TabsContent>

      {/* Tab: Customizações Aprovadas */}
      <TabsContent value="customizacoes">
        <ContractCustomizationsView
          customizations={scopeData?.customizations || []}
        />
      </TabsContent>

      {/* Tab: Definições via ATOs */}
      <TabsContent value="atos">
        <ContractATODefinitionsView
          approvedATOs={scopeData?.approvedATOs || []}
          contractId={contractId}
          onATOClick={handleATOClick}
        />
      </TabsContent>
    </Tabs>

    {/* Dialog para visualizar detalhes da ATO */}
    <ATODetailDialog
      open={showATODialog}
      onOpenChange={setShowATODialog}
      atoId={selectedATOId}
      defaultTab="details"
    />
  </>
  );
}
