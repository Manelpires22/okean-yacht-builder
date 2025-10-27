import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link2, CheckCircle, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface LinkedCustomizationsCardProps {
  contractId: string;
  quotationId: string;
}

export function LinkedCustomizationsCard({ contractId, quotationId }: LinkedCustomizationsCardProps) {
  const navigate = useNavigate();

  const { data: customizations, isLoading } = useQuery({
    queryKey: ["contract-linked-customizations", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_customizations")
        .select(`
          *,
          ato:additional_to_orders(
            id,
            ato_number,
            status
          )
        `)
        .eq("quotation_id", quotationId)
        .not("ato_id", "is", null);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!customizations || customizations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Customizações Convertidas
            </CardTitle>
            <CardDescription>
              Customizações da cotação que foram convertidas em ATOs
            </CardDescription>
          </div>
          <Badge variant="secondary">{customizations.length} vinculada(s)</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {customizations.map((customization: any) => (
          <div
            key={customization.id}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="font-medium">{customization.item_name}</p>
                {customization.pm_scope && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {customization.pm_scope}
                  </p>
                )}
              </div>
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
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

            {customization.ato && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">ATO Vinculado:</span>
                  <Badge variant="outline">{customization.ato.ato_number}</Badge>
                  <Badge
                    variant={
                      customization.ato.status === "approved"
                        ? "default"
                        : customization.ato.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {customization.ato.status === "approved"
                      ? "Aprovado"
                      : customization.ato.status === "rejected"
                      ? "Rejeitado"
                      : customization.ato.status === "pending_approval"
                      ? "Pendente"
                      : "Rascunho"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/quotations/${quotationId}`)}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver Cotação Original
        </Button>
      </CardContent>
    </Card>
  );
}
