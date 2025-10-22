import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { BASE_DISCOUNT_LIMITS, OPTIONS_DISCOUNT_LIMITS, getDiscountApprovalMessage } from "@/lib/approval-utils";
import { Save, Ship, Percent, AlertCircle } from "lucide-react";

interface ConfigurationSummaryProps {
  modelName: string;
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
  baseDeliveryDays: number;
  totalDeliveryDays: number;
  baseDiscountPercentage: number;
  optionsDiscountPercentage: number;
  finalBasePrice: number;
  finalOptionsPrice: number;
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
  onBaseDiscountChange: (percentage: number) => void;
  onOptionsDiscountChange: (percentage: number) => void;
  onSave: () => void;
}

export function ConfigurationSummary({
  modelName,
  basePrice,
  optionsPrice,
  totalPrice,
  baseDeliveryDays,
  totalDeliveryDays,
  baseDiscountPercentage,
  optionsDiscountPercentage,
  finalBasePrice,
  finalOptionsPrice,
  selectedOptions,
  optionsData,
  onBaseDiscountChange,
  onOptionsDiscountChange,
  onSave,
}: ConfigurationSummaryProps) {
  const requiresApproval = 
    baseDiscountPercentage > BASE_DISCOUNT_LIMITS.noApprovalRequired ||
    optionsDiscountPercentage > OPTIONS_DISCOUNT_LIMITS.noApprovalRequired;

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

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="base-discount" className="text-sm flex items-center gap-2">
              <Percent className="h-3 w-3" />
              Desconto Base (até {BASE_DISCOUNT_LIMITS.noApprovalRequired}% sem aprovação)
            </Label>
            <Input
              id="base-discount"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={baseDiscountPercentage}
              onChange={(e) => onBaseDiscountChange(parseFloat(e.target.value) || 0)}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="options-discount" className="text-sm flex items-center gap-2">
              <Percent className="h-3 w-3" />
              Desconto Opcionais (até {OPTIONS_DISCOUNT_LIMITS.noApprovalRequired}% sem aprovação)
            </Label>
            <Input
              id="options-discount"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={optionsDiscountPercentage}
              onChange={(e) => onOptionsDiscountChange(parseFloat(e.target.value) || 0)}
              className="text-right"
            />
          </div>
        </div>

        {requiresApproval && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {getDiscountApprovalMessage(baseDiscountPercentage, optionsDiscountPercentage)}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Preço Base</span>
            <span className="font-medium">{formatCurrency(basePrice)}</span>
          </div>
          {baseDiscountPercentage > 0 && (
            <>
              <div className="flex justify-between text-sm text-destructive">
                <span className="text-muted-foreground">Desconto Base ({baseDiscountPercentage}%)</span>
                <span>-{formatCurrency(basePrice - finalBasePrice)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Base Final</span>
                <span>{formatCurrency(finalBasePrice)}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Opcionais</span>
            <span className="font-medium">{formatCurrency(optionsPrice)}</span>
          </div>
          {optionsDiscountPercentage > 0 && (
            <>
              <div className="flex justify-between text-sm text-destructive">
                <span className="text-muted-foreground">Desconto Opcionais ({optionsDiscountPercentage}%)</span>
                <span>-{formatCurrency(optionsPrice - finalOptionsPrice)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Opcionais Final</span>
                <span>{formatCurrency(finalOptionsPrice)}</span>
              </div>
            </>
          )}
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
