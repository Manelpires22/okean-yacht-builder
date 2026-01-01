import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Save, TrendingUp } from "lucide-react";
import { useSimulatorExchangeRates, useUpdateExchangeRate } from "@/hooks/useSimulatorConfig";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminSimulatorRates() {
  const { data: rates, isLoading } = useSimulatorExchangeRates();
  const updateRate = useUpdateExchangeRate();
  const { refetch: fetchApiRate, isFetching: isFetchingApi } = useExchangeRate("EUR");

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const handleSave = async (currency: string) => {
    const value = parseFloat(editValues[currency] || "0");
    if (isNaN(value) || value <= 0) {
      toast.error("Valor inválido");
      return;
    }

    await updateRate.mutateAsync({ currency, default_rate: value, source: "manual" });
    setEditValues((prev) => ({ ...prev, [currency]: "" }));
  };

  const handleFetchFromApi = async (currency: string) => {
    try {
      const result = await fetchApiRate();
      if (result.data && typeof result.data === 'object' && 'rate' in result.data) {
        const rate = result.data.rate as number;
        await updateRate.mutateAsync({
          currency,
          default_rate: rate,
          source: "api",
        });
        toast.success(`Taxa ${currency} atualizada da API: ${rate.toFixed(4)}`);
      }
    } catch {
      toast.error("Erro ao buscar taxa da API");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Taxas de Câmbio
          </h1>
          <p className="text-muted-foreground">
            Configure as taxas de câmbio padrão para simulações
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {rates?.map((rate) => {
            const currentEdit = editValues[rate.currency] || "";
            const displayValue = currentEdit || rate.default_rate.toString();

            return (
              <Card key={rate.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {rate.currency === "EUR" ? "🇪🇺 Euro (EUR)" : "🇺🇸 Dólar (USD)"}
                    </CardTitle>
                    <Badge variant={rate.source === "api" ? "default" : "secondary"}>
                      {rate.source === "api" ? "API" : "Manual"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {rate.currency}/BRL - Última atualização:{" "}
                    {format(new Date(rate.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Taxa Atual (R$)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.0001"
                        value={displayValue}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            [rate.currency]: e.target.value,
                          }))
                        }
                        className="text-2xl font-bold"
                      />
                      <Button
                        onClick={() => handleSave(rate.currency)}
                        disabled={!currentEdit || updateRate.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleFetchFromApi(rate.currency)}
                      disabled={isFetchingApi}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingApi ? "animate-spin" : ""}`} />
                      Buscar da API
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    1 {rate.currency} = R$ {rate.default_rate.toFixed(4)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sobre as Taxas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • As taxas configuradas aqui são usadas como padrão nas simulações de viabilidade.
            </p>
            <p>
              • Você pode atualizar manualmente ou buscar o valor atual da API (AwesomeAPI).
            </p>
            <p>
              • Na página de simulação, usuários podem sobrescrever temporariamente esses valores.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
