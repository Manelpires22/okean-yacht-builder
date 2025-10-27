import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowRight, DollarSign, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { ConvertCustomizationDialog } from "./ConvertCustomizationDialog";

interface CustomizationToATOCardProps {
  contractId: string;
  quotationId: string;
}

export function CustomizationToATOCard({ contractId, quotationId }: CustomizationToATOCardProps) {
  const [selectedCustomization, setSelectedCustomization] = useState<any>(null);

  const { data: customizations, isLoading } = useQuery({
    queryKey: ["available-customizations", quotationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_customizations")
        .select("*")
        .eq("quotation_id", quotationId)
        .eq("status", "approved")
        .is("ato_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!customizations || customizations.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900 dark:text-orange-100">
                  Customizações Disponíveis para ATO
                </CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">
                  {customizations.length} customizaç{customizations.length === 1 ? "ão aprovada" : "ões aprovadas"} aguardando conversão em ATO
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {customizations.map((customization) => (
            <div
              key={customization.id}
              className="bg-background border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{customization.item_name}</h4>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Aprovada
                  </Badge>
                </div>

                {customization.pm_scope && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {customization.pm_scope}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-green-600">
                      +{formatCurrency(customization.pm_final_price || customization.additional_cost)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-orange-600">
                      +{customization.pm_final_delivery_impact_days || customization.delivery_impact_days} dias
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="default"
                size="sm"
                onClick={() => setSelectedCustomization(customization)}
                className="ml-4"
              >
                Converter em ATO
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="mt-4 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
            <strong>Dica:</strong> Converta essas customizações em ATOs para formalizar as mudanças no contrato e registrar os impactos financeiros e de prazo.
          </div>
        </CardContent>
      </Card>

      <ConvertCustomizationDialog
        open={!!selectedCustomization}
        onOpenChange={(open) => !open && setSelectedCustomization(null)}
        customization={selectedCustomization}
        contractId={contractId}
      />
    </>
  );
}
