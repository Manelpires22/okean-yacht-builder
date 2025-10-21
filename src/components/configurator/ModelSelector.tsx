import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useYachtModels } from "@/hooks/useYachtModels";
import { formatCurrency } from "@/lib/quotation-utils";
import { Ship } from "lucide-react";

interface ModelSelectorProps {
  onSelect: (modelId: string, basePrice: number, baseDeliveryDays: number) => void;
}

export function ModelSelector({ onSelect }: ModelSelectorProps) {
  const { data: models, isLoading } = useYachtModels();

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
                <p className="text-sm text-muted-foreground">
                  Prazo: {model.base_delivery_days} dias
                </p>
              </div>

              {model.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {model.description}
                </p>
              )}

              <Button
                className="w-full"
                onClick={() =>
                  onSelect(
                    model.id,
                    Number(model.base_price),
                    model.base_delivery_days
                  )
                }
              >
                Configurar este Modelo
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
