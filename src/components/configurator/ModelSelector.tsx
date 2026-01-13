import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useYachtModels } from "@/hooks/useYachtModels";
import { useIsModelExportable } from "@/hooks/usePricingRules";
import { formatCurrency } from "@/lib/quotation-utils";
import { Ship } from "lucide-react";
import { ConfigurationInitDialog } from "./ConfigurationInitDialog";
import { SaleTypeDialog } from "./SaleTypeDialog";
import { HullNumber } from "@/hooks/useHullNumbers";
import type { SaleType } from "@/lib/pricing-markup";

interface ModelSelectorProps {
  onSelect: (modelId: string, basePrice: number, baseDeliveryDays: number, hullNumber: HullNumber, saleType: SaleType, exportCountry: string | null) => void;
}

export function ModelSelector({ onSelect }: ModelSelectorProps) {
  const { data: models, isLoading } = useYachtModels();
  const [selectedModel, setSelectedModel] = useState<{
    id: string;
    name: string;
    basePrice: number;
    baseDeliveryDays: number;
  } | null>(null);
  
  // Estado para o fluxo após seleção do hull number
  const [pendingHullNumber, setPendingHullNumber] = useState<HullNumber | null>(null);
  const [showSaleTypeDialog, setShowSaleTypeDialog] = useState(false);
  
  // Verificar se o modelo selecionado é exportável
  const { data: isExportable } = useIsModelExportable(selectedModel?.id || null);

  const handleModelClick = (model: any) => {
    setSelectedModel({
      id: model.id,
      name: model.name,
      basePrice: Number(model.base_price),
      baseDeliveryDays: model.base_delivery_days,
    });
  };

  const handleHullNumberConfirm = (hullNumber: HullNumber) => {
    if (!selectedModel) return;
    
    // Se modelo é exportável, mostrar dialog de tipo de venda
    if (isExportable) {
      setPendingHullNumber(hullNumber);
      setShowSaleTypeDialog(true);
    } else {
      // Modelo não exportável, assumir nacional
      onSelect(
        selectedModel.id,
        selectedModel.basePrice,
        selectedModel.baseDeliveryDays,
        hullNumber,
        'national',
        null
      );
      setSelectedModel(null);
    }
  };

  const handleSaleTypeConfirm = (saleType: SaleType, exportCountry: string | null) => {
    if (selectedModel && pendingHullNumber) {
      onSelect(
        selectedModel.id,
        selectedModel.basePrice,
        selectedModel.baseDeliveryDays,
        pendingHullNumber,
        saleType,
        exportCountry
      );
      setSelectedModel(null);
      setPendingHullNumber(null);
      setShowSaleTypeDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-48 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Ship className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhum modelo disponível</p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com o administrador
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Selecione um Modelo</h2>
          <p className="text-muted-foreground">
            Escolha o modelo de iate que deseja configurar
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <Card key={model.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                {model.image_url ? (
                  <img
                    src={model.image_url}
                    alt={model.name}
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center">
                    <Ship className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <CardTitle>{model.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {model.code}
                  </CardDescription>
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(model.base_price))}
                  </p>
                </div>

                {model.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {model.description}
                  </p>
                )}

                <Button
                  className="w-full"
                  onClick={() => handleModelClick(model)}
                >
                  Configurar este Modelo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedModel && !showSaleTypeDialog && (
        <ConfigurationInitDialog
          open={!!selectedModel && !showSaleTypeDialog}
          onOpenChange={(open) => !open && setSelectedModel(null)}
          yachtModelId={selectedModel.id}
          yachtModelName={selectedModel.name}
          onConfirm={handleHullNumberConfirm}
        />
      )}

      {showSaleTypeDialog && selectedModel && (
        <SaleTypeDialog
          open={showSaleTypeDialog}
          modelName={selectedModel.name}
          onConfirm={handleSaleTypeConfirm}
        />
      )}
    </>
  );
}
