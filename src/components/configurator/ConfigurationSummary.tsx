import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { BASE_DISCOUNT_LIMITS, OPTIONS_DISCOUNT_LIMITS, getDiscountApprovalMessage } from "@/lib/approval-utils";
import { Save, Ship, Percent, AlertCircle, Edit, ChevronDown } from "lucide-react";
import { Customization } from "@/hooks/useConfigurationState";
import { MessageSquare } from "lucide-react";

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
    customization_notes?: string;
  }>;
  optionsData?: Array<{
    id: string;
    name: string;
  }>;
  customizations: Customization[];
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
  customizations,
  onBaseDiscountChange,
  onOptionsDiscountChange,
  onSave,
}: ConfigurationSummaryProps) {
  const requiresApproval = 
    baseDiscountPercentage > BASE_DISCOUNT_LIMITS.noApprovalRequired ||
    optionsDiscountPercentage > OPTIONS_DISCOUNT_LIMITS.noApprovalRequired;

  // Count total customizations (base/free + option customizations)
  const optionCustomizationsCount = selectedOptions.filter(opt => opt.customization_notes).length;
  const totalCustomizations = customizations.length + optionCustomizationsCount;

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
                  <div key={selected.option_id} className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{optionName}</span>
                      <span className="font-medium">
                        {formatCurrency(selected.unit_price * selected.quantity)}
                      </span>
                    </div>
                    {selected.customization_notes && (
                      <div className="flex items-start gap-1 pl-2 py-1 bg-accent/30 rounded-sm">
                        <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          {selected.customization_notes}
                        </p>
                      </div>
                    )}
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

        {totalCustomizations > 0 && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Customizações</p>
                <Badge variant="secondary">{totalCustomizations}</Badge>
              </div>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-xs">Ver solicitações</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {customizations.map((customization) => (
                    <div
                      key={customization.memorial_item_id}
                      className="p-2 bg-accent/50 rounded-md"
                    >
                      <p className="text-xs font-medium mb-1">
                        <Edit className="h-3 w-3 inline mr-1" />
                        {customization.item_name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {customization.notes}
                      </p>
                    </div>
                  ))}
                  {selectedOptions
                    .filter(opt => opt.customization_notes)
                    .map((selected) => {
                      const optionName = optionsData?.find(
                        (o) => o.id === selected.option_id
                      )?.name || "Opcional";
                      return (
                        <div
                          key={`customization-${selected.option_id}`}
                          className="p-2 bg-accent/50 rounded-md"
                        >
                          <p className="text-xs font-medium mb-1">
                            <MessageSquare className="h-3 w-3 inline mr-1" />
                            {optionName}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {selected.customization_notes}
                          </p>
                        </div>
                      );
                    })}
                </CollapsibleContent>
              </Collapsible>
            </div>
            <Separator />
          </>
        )}

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
