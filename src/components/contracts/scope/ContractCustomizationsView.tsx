import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/quotation-utils";
import { Wrench, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Customization {
  id: string;
  item_name: string;
  notes: string | null;
  pm_final_price: number;
  pm_final_delivery_impact_days: number;
  status: string;
  workflow_status?: string;
  customization_code?: string;
}

interface ContractCustomizationsViewProps {
  customizations: Customization[];
}

export function ContractCustomizationsView({
  customizations,
}: ContractCustomizationsViewProps) {
  const approvedCustomizations = customizations.filter(
    (c) => c.status === "approved" || c.workflow_status === "approved"
  );

  const totalCost = approvedCustomizations.reduce(
    (sum, c) => sum + (c.pm_final_price || 0),
    0
  );
  const totalDays = approvedCustomizations.reduce(
    (sum, c) => sum + (c.pm_final_delivery_impact_days || 0),
    0
  );

  if (approvedCustomizations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma customização aprovada no contrato base
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      approved: "Aprovada",
      rejected: "Rejeitada",
      pending: "Pendente",
      pending_pm_review: "Análise PM",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customizações Aprovadas</h3>
        <div className="flex gap-2">
          <Badge variant="outline">
            {approvedCustomizations.length} customizações
          </Badge>
          <Badge variant="default">{formatCurrency(totalCost)}</Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {approvedCustomizations.map((customization) => (
          <Card key={customization.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    {customization.item_name}
                  </CardTitle>
                  {customization.customization_code && (
                    <p className="text-sm text-muted-foreground">
                      Código: {customization.customization_code}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="default" className="text-base px-4 py-1">
                    {formatCurrency(customization.pm_final_price || 0)}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {getStatusIcon(
                      customization.workflow_status || customization.status
                    )}
                    {getStatusLabel(
                      customization.workflow_status || customization.status
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customization.notes && (
                  <p className="text-sm text-muted-foreground">
                    {customization.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  {customization.pm_final_delivery_impact_days > 0 && (
                    <div>
                      <strong>Impacto Prazo:</strong>{" "}
                      <Badge variant="secondary">
                        +{customization.pm_final_delivery_impact_days} dias
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold">Total de Customizações</p>
              <p className="text-sm text-muted-foreground">
                {approvedCustomizations.length} item(ns) aprovado(s)
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              {totalDays > 0 && (
                <p className="text-sm text-muted-foreground">
                  +{totalDays} dias no prazo
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
