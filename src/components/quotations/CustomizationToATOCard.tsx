import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSignature, ArrowRight, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import { ConvertCustomizationDialog } from "@/components/contracts/ConvertCustomizationDialog";

interface CustomizationToATOCardProps {
  customizations: any[];
  contractId: string | null;
}

export function CustomizationToATOCard({ customizations, contractId }: CustomizationToATOCardProps) {
  const [selectedCustomization, setSelectedCustomization] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filtrar apenas customizações aprovadas que podem ser convertidas
  const convertibleCustomizations = customizations.filter(
    (c) => c.status === "approved" && !c.ato_id
  );

  const convertedCustomizations = customizations.filter((c) => c.ato_id);

  if (!contractId) return null;
  if (convertibleCustomizations.length === 0 && convertedCustomizations.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Customizações → ATOs
              </CardTitle>
              <CardDescription>
                Converter customizações aprovadas em ATOs do contrato
              </CardDescription>
            </div>
            {convertibleCustomizations.length > 0 && (
              <Badge variant="secondary">
                {convertibleCustomizations.length} disponível(is)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customizações disponíveis para conversão */}
          {convertibleCustomizations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Disponíveis para Conversão
              </h4>
              {convertibleCustomizations.map((customization) => (
                <div
                  key={customization.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{customization.item_name}</p>
                      {customization.pm_scope && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {customization.pm_scope}
                        </p>
                      )}
                    </div>
                    <Badge variant="default">Aprovado</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Custo: </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(customization.additional_cost || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prazo: </span>
                      <span className="font-semibold text-orange-600">
                        +{customization.delivery_impact_days || 0} dias
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedCustomization(customization);
                      setDialogOpen(true);
                    }}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Converter em ATO
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Customizações já convertidas */}
          {convertedCustomizations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Já Convertidas
              </h4>
              {convertedCustomizations.map((customization) => (
                <div
                  key={customization.id}
                  className="border rounded-lg p-4 bg-muted/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{customization.item_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Convertida em ATO</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCustomization && (
        <ConvertCustomizationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customization={selectedCustomization}
          contractId={contractId}
        />
      )}
    </>
  );
}
