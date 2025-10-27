import { useParams } from "react-router-dom";
import { useContract } from "@/hooks/useContracts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractHeroSection } from "@/components/contracts/ContractHeroSection";
import { ContractOverview } from "@/components/contracts/ContractOverview";
import { ATOsList } from "@/components/contracts/ATOsList";
import { LiveContractView } from "@/components/contracts/LiveContractView";
import { ContractTimeline } from "@/components/contracts/ContractTimeline";
import { FileText, Plus, TrendingUp, Clock } from "lucide-react";

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: contract, isLoading } = useContract(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="container mx-auto p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Contrato não encontrado</h2>
          <p className="text-muted-foreground">
            O contrato solicitado não existe ou você não tem permissão para visualizá-lo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ContractHeroSection contract={contract} />

      <div className="container mx-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="atos" className="gap-2">
              <Plus className="h-4 w-4" />
              ATOs
            </TabsTrigger>
            <TabsTrigger value="consolidated" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Contrato Consolidado
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Linha do Tempo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ContractOverview contract={contract} />
          </TabsContent>

          <TabsContent value="atos">
            <ATOsList contractId={contract.id} />
          </TabsContent>

          <TabsContent value="consolidated">
            <LiveContractView contractId={contract.id} />
          </TabsContent>

          <TabsContent value="timeline">
            <ContractTimeline contractId={contract.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
