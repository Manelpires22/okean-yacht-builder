import { useParams, useNavigate } from "react-router-dom";
import { useContract, useDeleteContract } from "@/hooks/useContracts";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractHeroSection } from "@/components/contracts/ContractHeroSection";
import { ContractOverview } from "@/components/contracts/ContractOverview";
import { ATOsList } from "@/components/contracts/ATOsList";
import { LiveContractView } from "@/components/contracts/LiveContractView";
import { ContractTimeline } from "@/components/contracts/ContractTimeline";
import { ATODetailDialog } from "@/components/contracts/ATODetailDialog";
import { CustomizationToATOCard } from "@/components/contracts/CustomizationToATOCard";
import { FileText, Plus, TrendingUp, Clock, ArrowLeft, Package } from "lucide-react";
import { DeliveryProgress } from "@/components/contracts/delivery/DeliveryProgress";
import { DeliveryChecklist } from "@/components/contracts/delivery/DeliveryChecklist";
import { FinalizeDeliveryDialog } from "@/components/contracts/delivery/FinalizeDeliveryDialog";
import { useContractDeliveryChecklist, calculateProgress } from "@/hooks/useContractDeliveryChecklist";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(id);
  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedATOFromTimeline, setSelectedATOFromTimeline] = useState<string | null>(null);
  
  // Delivery checklist
  const { data: checklistItems, isLoading: isLoadingChecklist } = useContractDeliveryChecklist(id);
  const progress = checklistItems ? calculateProgress(checklistItems) : { total: 0, verified: 0, percentage: 0 };

  const handleDelete = () => {
    if (!id) return;
    
    deleteContract(id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        navigate("/contratos");
      },
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!contract) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Contrato não encontrado</h2>
            <p className="text-muted-foreground">
              O contrato solicitado não existe ou você não tem permissão para visualizá-lo.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate("/contratos")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Contratos
        </Button>

        <ContractHeroSection 
          contract={contract} 
          onDelete={() => setShowDeleteDialog(true)}
        />
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="atos" className="gap-2">
              <Plus className="h-4 w-4" />
              Aditivos (ATOs)
            </TabsTrigger>
            <TabsTrigger value="consolidated" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Consolidado
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-2">
              <Package className="h-4 w-4" />
              Entrega
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CustomizationToATOCard 
              contractId={contract.id} 
              quotationId={contract.quotation_id} 
            />
            <ContractOverview contract={contract} />
          </TabsContent>

          <TabsContent value="atos">
            <ATOsList contractId={contract.id} />
          </TabsContent>

          <TabsContent value="consolidated">
            <LiveContractView contractId={contract.id} />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <DeliveryProgress progress={progress} />
            <DeliveryChecklist items={checklistItems || []} isLoading={isLoadingChecklist} contractId={contract.id} />
            {checklistItems && (
              <FinalizeDeliveryDialog 
                contractId={contract.id}
                isAllVerified={progress.percentage === 100}
              />
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <ContractTimeline 
              contractId={contract.id}
              onATOClick={(atoId) => setSelectedATOFromTimeline(atoId)}
            />
          </TabsContent>
        </Tabs>

        {/* Dialog para ATOs clicadas na timeline */}
        <ATODetailDialog
          open={!!selectedATOFromTimeline}
          onOpenChange={(open) => !open && setSelectedATOFromTimeline(null)}
          atoId={selectedATOFromTimeline}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão do contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contrato será permanentemente deletado e a cotação será revertida para o status "Aceita".
              <br /><br />
              As customizações também serão desmarcadas do contrato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deletando..." : "Deletar Contrato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
