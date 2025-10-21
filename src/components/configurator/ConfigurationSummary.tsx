import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { Save, Ship } from "lucide-react";

interface ConfigurationSummaryProps {
  modelName: string;
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
  baseDeliveryDays: number;
  totalDeliveryDays: number;
  selectedOptions: Array<{
    option_id: string;
    quantity: number;
    unit_price: number;
    delivery_days_impact: number;
  }>;
  optionsData?: Array<{
    id: string;
    name: string;
  }>;
  onSave: () => void;
}

export function ConfigurationSummary({
  modelName,
  basePrice,
  optionsPrice,
  totalPrice,
  baseDeliveryDays,
  totalDeliveryDays,
  selectedOptions,
  optionsData,
  onSave,
}: ConfigurationSummaryProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5" />
          Resumo da Configuração
        </CardTitle>
        <CardDescription>
          Revise sua seleção antes de salvar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Modelo Selecionado</p>
          <p className="text-lg font-semibold">{modelName}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(basePrice)}
          </p>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Opcionais</p>
            <Badge variant="secondary">{selectedOptions.length}</Badge>
          </div>
          {selectedOptions.length > 0 ? (
            <div className="space-y-2">
              {selectedOptions.map((selected) => {
                const optionName = optionsData?.find(
                  (o) => o.id === selected.option_id
                )?.name || "Opcional";
                return (
                  <div key={selected.option_id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{optionName}</span>
                      <span className="font-medium">
                        {formatCurrency(selected.unit_price * selected.quantity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Nenhum opcional selecionado
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Preço Base</span>
            <span className="font-medium">{formatCurrency(basePrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Opcionais</span>
            <span className="font-medium">{formatCurrency(optionsPrice)}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-semibold">Preço Total</span>
            <span className="text-2xl font-bold">{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prazo Base</span>
            <span>{formatDays(baseDeliveryDays)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-medium">Prazo Total</span>
            <span className="text-lg font-semibold">
              {formatDays(totalDeliveryDays)}
            </span>
          </div>
        </div>

        <Separator />

        <Button className="w-full" size="lg" onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Cotação
        </Button>
      </CardContent>
    </Card>
  );
}
