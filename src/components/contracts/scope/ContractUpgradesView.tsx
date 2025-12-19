import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";

interface UpgradeItem {
  id: string;
  upgrade_id: string;
  memorial_item_id: string;
  price: number;
  delivery_days_impact: number;
  customization_notes?: string;
  upgrade?: {
    name: string;
    code: string;
    description?: string;
    brand?: string;
    model?: string;
  };
  memorial_item?: {
    item_name: string;
  };
}

interface ContractUpgradesViewProps {
  upgrades: UpgradeItem[];
}

export function ContractUpgradesView({ upgrades }: ContractUpgradesViewProps) {
  if (!upgrades || upgrades.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ArrowUpCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum upgrade configurado</p>
        </CardContent>
      </Card>
    );
  }

  const totalPrice = upgrades.reduce((sum, u) => sum + (u.price || 0), 0);
  const totalDays = upgrades.reduce((sum, u) => sum + (u.delivery_days_impact || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ArrowUpCircle className="h-5 w-5" />
          Upgrades do Contrato
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary">{upgrades.length} upgrade(s)</Badge>
          <Badge variant="outline">{formatCurrency(totalPrice)}</Badge>
          {totalDays > 0 && (
            <Badge variant="outline">+{totalDays} dias</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upgrades.map((upgrade) => (
            <div
              key={upgrade.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">
                    {upgrade.upgrade?.name || "Upgrade"}
                  </h4>
                  {upgrade.upgrade?.code && (
                    <p className="text-sm text-muted-foreground">
                      Código: {upgrade.upgrade.code}
                    </p>
                  )}
                  {upgrade.memorial_item?.item_name && (
                    <p className="text-sm text-muted-foreground">
                      Substitui: {upgrade.memorial_item.item_name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    {formatCurrency(upgrade.price || 0)}
                  </p>
                  {upgrade.delivery_days_impact > 0 && (
                    <p className="text-sm text-muted-foreground">
                      +{upgrade.delivery_days_impact} dias
                    </p>
                  )}
                </div>
              </div>

              {upgrade.upgrade?.description && (
                <p className="text-sm text-muted-foreground">
                  {upgrade.upgrade.description}
                </p>
              )}

              {(upgrade.upgrade?.brand || upgrade.upgrade?.model) && (
                <div className="flex gap-2">
                  {upgrade.upgrade?.brand && (
                    <Badge variant="outline">{upgrade.upgrade.brand}</Badge>
                  )}
                  {upgrade.upgrade?.model && (
                    <Badge variant="outline">{upgrade.upgrade.model}</Badge>
                  )}
                </div>
              )}

              {upgrade.customization_notes && (
                <p className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3">
                  {upgrade.customization_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
