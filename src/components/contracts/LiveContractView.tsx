import { useLiveContract } from "@/hooks/useContracts";
import { useConsolidatedContractScope } from "@/hooks/useConsolidatedContractScope";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, FileText, TrendingUp, BookOpen, Package, Wrench, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { ContractMemorialView } from "./scope/ContractMemorialView";
import { ContractOptionsView } from "./scope/ContractOptionsView";
import { ContractCustomizationsView } from "./scope/ContractCustomizationsView";
import { ContractATODefinitionsView } from "./scope/ContractATODefinitionsView";

interface LiveContractViewProps {
  contractId: string;
}

export function LiveContractView({ contractId }: LiveContractViewProps) {
  const { data: liveContract, isLoading: liveLoading } = useLiveContract(contractId);
  const { data: scopeData, isLoading: scopeLoading } = useConsolidatedContractScope(contractId);

  const isLoading = liveLoading || scopeLoading;

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
    <Tabs defaultValue="resumo" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="resumo" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Resumo
        </TabsTrigger>
        <TabsTrigger value="memorial" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Memorial
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
        {/* Card Principal: Contrato Consolidado */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="h-6 w-6 text-primary" />
                Contrato Consolidado
              </CardTitle>
              <CardDescription className="text-base">
                Valores e prazos atualizados em tempo real com todas as ATOs aprovadas
              </CardDescription>
            </div>
            <Badge variant="default" className="text-lg px-6 py-3">
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
      </TabsContent>

      {/* Tab: Memorial Base */}
      <TabsContent value="memorial">
        <ContractMemorialView items={scopeData?.memorialItems || []} />
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
        />
      </TabsContent>
    </Tabs>
  );
}
