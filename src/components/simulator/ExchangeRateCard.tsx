import { useState } from "react";
import { RefreshCw, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useExchangeRate, Currency } from "@/hooks/useExchangeRate";
import { formatDate } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";

interface ExchangeRateCardProps {
  currency: Currency;
  onRateChange: (rate: number) => void;
  currentRate: number;
}

export function ExchangeRateCard({ currency, onRateChange, currentRate }: ExchangeRateCardProps) {
  const [useManualRate, setUseManualRate] = useState(false);
  const [manualRate, setManualRate] = useState("");
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch, isFetching } = useExchangeRate(currency);

  const handleManualToggle = (checked: boolean) => {
    setUseManualRate(checked);
    if (!checked && data?.rate) {
      onRateChange(data.rate);
    }
  };

  const handleManualRateChange = (value: string) => {
    setManualRate(value);
    const numValue = parseFloat(value.replace(',', '.'));
    if (!isNaN(numValue) && numValue > 0) {
      onRateChange(numValue);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['exchange-rate', currency] });
    refetch();
  };

  // Atualizar rate quando dados chegarem
  if (data?.rate && !useManualRate && currentRate !== data.rate) {
    onRateChange(data.rate);
  }

  const displayRate = useManualRate 
    ? parseFloat(manualRate.replace(',', '.')) || 0
    : data?.rate || currentRate;

  const sourceLabel = {
    'bcb': 'Banco Central',
    'cache': 'Cache (BCB)',
    'cache-fallback': 'Cache (fallback)',
  };

  const Icon = currency === 'USD' ? DollarSign : TrendingUp;
  const currencyLabel = currency === 'USD' ? 'USD/BRL' : 'EUR/BRL';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5 text-primary" />
            Câmbio {currencyLabel}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Erro ao buscar cotação</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                R$ {displayRate.toFixed(4).replace('.', ',')}
              </span>
              {data?.source && !useManualRate && (
                <span className="text-xs text-muted-foreground">
                  via {sourceLabel[data.source]}
                </span>
              )}
            </div>
            
            {data?.updatedAt && !useManualRate && (
              <p className="text-xs text-muted-foreground">
                Atualizado: {formatDate(data.updatedAt)} às{' '}
                {new Date(data.updatedAt).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            )}
          </>
        )}

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`manual-rate-${currency}`} className="text-sm">
              Usar valor manual
            </Label>
            <Switch
              id={`manual-rate-${currency}`}
              checked={useManualRate}
              onCheckedChange={handleManualToggle}
            />
          </div>
          
          {useManualRate && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                type="text"
                placeholder="6,2450"
                value={manualRate}
                onChange={(e) => handleManualRateChange(e.target.value)}
                className="w-32"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
