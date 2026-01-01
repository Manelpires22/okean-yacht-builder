import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Save, Check, Ship, ArrowRight, Globe, Home } from "lucide-react";
import { useSimulatorModelCosts, useUpsertModelCost, useSimulatorExchangeRates, SimulatorModelCost } from "@/hooks/useSimulatorConfig";
import { useYachtModels } from "@/hooks/useYachtModels";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

interface ModelCostState {
  custo_mp_import: number;
  custo_mp_import_currency: "EUR" | "USD";
  custo_mp_nacional: number;
  custo_mo_horas: number;
  custo_mo_valor_hora: number;
  tax_import_percent: number;
  is_exportable: boolean;
}

export default function AdminSimulatorCosts() {
  const { data: costs, isLoading: loadingCosts } = useSimulatorModelCosts();
  const { data: yachtModels, isLoading: loadingModels } = useYachtModels();
  const { data: exchangeRates, isLoading: loadingRates } = useSimulatorExchangeRates();
  const upsertCost = useUpsertModelCost();

  // Estado local para edição de cada modelo
  const [editStates, setEditStates] = useState<Record<string, ModelCostState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Criar mapa de custos existentes por yacht_model_id
  const costsMap = useMemo(() => {
    const map: Record<string, SimulatorModelCost> = {};
    costs?.forEach((c) => {
      map[c.yacht_model_id] = c;
    });
    return map;
  }, [costs]);

  // Criar mapa de câmbios
  const ratesMap = useMemo(() => {
    const map: Record<string, number> = { EUR: 0, USD: 0 };
    exchangeRates?.forEach((r) => {
      map[r.currency] = r.default_rate;
    });
    return map;
  }, [exchangeRates]);

  // Converter valor em moeda estrangeira para BRL
  const convertToBRL = (value: number, currency: "EUR" | "USD") => {
    const rate = ratesMap[currency] || 0;
    return value * rate;
  };

  // Obter estado do modelo (editado localmente ou do banco)
  const getModelState = (modelId: string): ModelCostState => {
    if (editStates[modelId]) {
      return editStates[modelId];
    }
    const existingCost = costsMap[modelId];
    if (existingCost) {
      return {
        custo_mp_import: existingCost.custo_mp_import,
        custo_mp_import_currency: existingCost.custo_mp_import_currency || "EUR",
        custo_mp_nacional: existingCost.custo_mp_nacional,
        custo_mo_horas: existingCost.custo_mo_horas,
        custo_mo_valor_hora: existingCost.custo_mo_valor_hora,
        tax_import_percent: existingCost.tax_import_percent,
        is_exportable: existingCost.is_exportable ?? false,
      };
    }
    return {
      custo_mp_import: 0,
      custo_mp_import_currency: "EUR",
      custo_mp_nacional: 0,
      custo_mo_horas: 0,
      custo_mo_valor_hora: 55,
      tax_import_percent: 8,
      is_exportable: false,
    };
  };

  // Atualizar estado local
  const updateField = (modelId: string, field: keyof ModelCostState, value: number | string | boolean) => {
    const currentState = getModelState(modelId);
    
    setEditStates((prev) => ({
      ...prev,
      [modelId]: {
        ...currentState,
        [field]: value,
      },
    }));
  };

  // Salvar custos do modelo
  const handleSave = async (modelId: string) => {
    const state = getModelState(modelId);
    setSavingId(modelId);

    try {
      await upsertCost.mutateAsync({
        yacht_model_id: modelId,
        custo_mp_import: state.custo_mp_import,
        custo_mp_import_currency: state.custo_mp_import_currency,
        custo_mp_nacional: state.custo_mp_nacional,
        custo_mo_horas: state.custo_mo_horas,
        custo_mo_valor_hora: state.custo_mo_valor_hora,
        tax_import_percent: state.tax_import_percent,
        is_exportable: state.is_exportable,
      });

      // Limpar estado local após salvar
      setEditStates((prev) => {
        const newState = { ...prev };
        delete newState[modelId];
        return newState;
      });

      toast.success("Custos salvos com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar custos");
    } finally {
      setSavingId(null);
    }
  };

  // Calcular totais
  const calcMPImportBRL = (state: ModelCostState) => 
    convertToBRL(state.custo_mp_import, state.custo_mp_import_currency);
  const calcImpostoImportBRL = (state: ModelCostState) => 
    calcMPImportBRL(state) * (state.tax_import_percent / 100);
  const calcTotalMO = (state: ModelCostState) => state.custo_mo_horas * state.custo_mo_valor_hora;
  const calcTotalMP = (state: ModelCostState) => calcMPImportBRL(state) + state.custo_mp_nacional;
  const calcTotalCusto = (state: ModelCostState) =>
    calcMPImportBRL(state) + state.custo_mp_nacional + calcTotalMO(state) + calcImpostoImportBRL(state);

  // Verificar se modelo tem custos configurados
  const isConfigured = (modelId: string) => !!costsMap[modelId];

  // Verificar se há mudanças não salvas
  const hasChanges = (modelId: string) => !!editStates[modelId];

  if (loadingCosts || loadingModels || loadingRates) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const configuredCount = yachtModels?.filter((m) => isConfigured(m.id)).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Custos por Modelo
          </h1>
          <p className="text-muted-foreground">
            Configure os custos base de cada modelo de iate •{" "}
            <span className="font-medium">{configuredCount}/{yachtModels?.length || 0} configurados</span>
            {ratesMap.EUR > 0 && (
              <span className="ml-2 text-xs">
                (EUR: R$ {ratesMap.EUR.toFixed(2)} | USD: R$ {ratesMap.USD.toFixed(2)})
              </span>
            )}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {yachtModels?.map((model) => {
            const state = getModelState(model.id);
            const configured = isConfigured(model.id);
            const changed = hasChanges(model.id);
            const saving = savingId === model.id;
            const mpImportBRL = calcMPImportBRL(state);
            const impostoImportBRL = calcImpostoImportBRL(state);

            return (
              <Card
                key={model.id}
                className={`relative transition-colors ${
                  configured ? "border-success/50" : "border-muted"
                } ${changed ? "ring-2 ring-primary/50" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {/* Foto do modelo */}
                    <div className="h-20 w-28 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {model.image_url ? (
                        <img
                          src={model.image_url}
                          alt={model.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Ship className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info do modelo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg truncate">{model.name}</CardTitle>
                        {configured && (
                          <Badge variant="outline" className="text-success border-success shrink-0">
                            <Check className="h-3 w-3 mr-1" />
                            Configurado
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">{model.code}</CardDescription>
                      
                      {/* Toggle Exportável */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`export-${model.id}`}
                            checked={state.is_exportable}
                            onCheckedChange={(checked) => updateField(model.id, "is_exportable", checked)}
                          />
                          <Label htmlFor={`export-${model.id}`} className="text-sm cursor-pointer">
                            {state.is_exportable ? (
                              <span className="flex items-center gap-1 text-success">
                                <Globe className="h-3.5 w-3.5" />
                                Exportável
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Home className="h-3.5 w-3.5" />
                                Venda Nacional
                              </span>
                            )}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* MP Importada com seletor de moeda */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Matéria-Prima Importada</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={state.custo_mp_import_currency}
                        onValueChange={(v) => updateField(model.id, "custo_mp_import_currency", v as "EUR" | "USD")}
                      >
                        <SelectTrigger className="h-9 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR €</SelectItem>
                          <SelectItem value="USD">USD $</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="h-9 flex-1"
                        value={state.custo_mp_import || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateField(model.id, "custo_mp_import", parseFloat(e.target.value) || 0)
                        }
                      />
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="bg-muted px-3 py-2 rounded-md text-sm font-medium min-w-[120px] text-right">
                        {formatCurrency(mpImportBRL)}
                      </div>
                    </div>
                  </div>

                  {/* MP Nacional */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Matéria-Prima Nacional (R$)</Label>
                    <Input
                      type="number"
                      className="h-9"
                      value={state.custo_mp_nacional || ""}
                      placeholder="0"
                      onChange={(e) =>
                        updateField(model.id, "custo_mp_nacional", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  {/* Mão de Obra */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Horas MO</Label>
                      <Input
                        type="number"
                        className="h-9"
                        value={state.custo_mo_horas || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateField(model.id, "custo_mo_horas", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Valor/Hora (R$)</Label>
                      <Input
                        type="number"
                        className="h-9"
                        value={state.custo_mo_valor_hora || ""}
                        placeholder="55"
                        onChange={(e) =>
                          updateField(model.id, "custo_mo_valor_hora", parseFloat(e.target.value) || 55)
                        }
                      />
                    </div>
                  </div>

                  {/* Imposto Importação */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Imposto Importação (%)</Label>
                      <Input
                        type="number"
                        className="h-9"
                        value={state.tax_import_percent || ""}
                        placeholder="8"
                        onChange={(e) =>
                          updateField(model.id, "tax_import_percent", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Imposto Importação (R$)</Label>
                      <div className="bg-muted px-3 py-2 h-9 rounded-md text-sm font-medium flex items-center">
                        {formatCurrency(impostoImportBRL)}
                      </div>
                    </div>
                  </div>

                  {/* Totais e Botão Salvar */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm space-y-0.5">
                      <div>
                        <span className="text-muted-foreground">Total MP:</span>{" "}
                        <span className="font-medium">{formatCurrency(calcTotalMP(state))}</span>
                        <span className="mx-2 text-muted-foreground">|</span>
                        <span className="text-muted-foreground">Imp. Import:</span>{" "}
                        <span className="font-medium">{formatCurrency(impostoImportBRL)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total MO:</span>{" "}
                        <span className="font-medium">{formatCurrency(calcTotalMO(state))}</span>
                        <span className="mx-2 text-muted-foreground">|</span>
                        <span className="text-muted-foreground">Total:</span>{" "}
                        <span className="font-bold">{formatCurrency(calcTotalCusto(state))}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(model.id)}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!yachtModels?.length && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum modelo de iate cadastrado.</p>
              <p className="text-sm">Cadastre modelos na seção "Barcos" primeiro.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
