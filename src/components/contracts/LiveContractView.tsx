import { useState } from "react";
import { useLiveContract } from "@/hooks/useContracts";
import { useConsolidatedContractScope } from "@/hooks/useConsolidatedContractScope";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, FileText, TrendingUp, BookOpen, Package, Wrench, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { ContractMemorialView } from "./scope/ContractMemorialView";
import { ContractOptionsView } from "./scope/ContractOptionsView";
import { ContractCustomizationsView } from "./scope/ContractCustomizationsView";
import { ContractATODefinitionsView } from "./scope/ContractATODefinitionsView";
import { ATODetailDialog } from "./ATODetailDialog";

interface LiveContractViewProps {
  contractId: string;
}

export function LiveContractView({ contractId }: LiveContractViewProps) {
  const { data: liveContract, isLoading: liveLoading } = useLiveContract(contractId);
  const { data: scopeData, isLoading: scopeLoading } = useConsolidatedContractScope(contractId);
  const [selectedATOId, setSelectedATOId] = useState<string | null>(null);
  const [showATODialog, setShowATODialog] = useState(false);

  const isLoading = liveLoading || scopeLoading;

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

  const priceVariation = liveContract.current_total_price - liveContract.base_price;
  const daysVariation = liveContract.current_total_delivery_days - liveContract.base_delivery_days;

  return (
    <>
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
                  <p className="text-sm text-muted-foreground mb-2">Valor Total ATOs Aprovadas</p>
                  <p className="text-2xl font-semibold text-green-600">
                    + {formatCurrency(liveContract.total_atos_price || 0)}
                  </p>
                  <Badge className="mt-2" variant="secondary">
                    {liveContract.approved_atos_count} ATO(s) aprovada(s)
                  </Badge>
                </div>
                
                {/* Separador visual */}
                <Separator className="my-4" />
                
                {/* 3. Total Consolidado */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Valor Total Atual</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(liveContract.current_total_price)}
                  </p>
                  {priceVariation !== 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Variação:{" "}
                      <span className="text-green-600 font-semibold">
                        +{formatCurrency(priceVariation)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Coluna PRAZOS */}
              <div className="space-y-6">
                {/* 1. Prazo Original */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Prazo Base</p>
                  <p className="text-3xl font-bold text-primary">
                    {liveContract.base_delivery_days} dias
                  </p>
                </div>
                
                {/* 2. Impacto ATOs */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Impacto ATOs no Prazo</p>
                  <p className="text-2xl font-semibold text-orange-600">
                    + {liveContract.total_atos_delivery_days || 0} dias
                  </p>
                </div>
                
                {/* Separador visual */}
                <Separator className="my-4" />
                
                {/* 3. Prazo Final */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Prazo Total Atual</p>
                  <p className="text-4xl font-bold text-primary">
                    {liveContract.current_total_delivery_days} dias
                  </p>
                  {daysVariation !== 0 && (
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
