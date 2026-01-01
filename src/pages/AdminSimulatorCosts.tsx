import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Save, Check, Ship } from "lucide-react";
import { useSimulatorModelCosts, useUpsertModelCost, SimulatorModelCost } from "@/hooks/useSimulatorConfig";
import { useYachtModels } from "@/hooks/useYachtModels";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

interface ModelCostState {
  custo_mp_import: number;
  custo_mp_nacional: number;
  custo_mo_horas: number;
  custo_mo_valor_hora: number;
  projeto: "OKEAN" | "Ferretti";
  tax_import_percent: number;
}

export default function AdminSimulatorCosts() {
  const { data: costs, isLoading: loadingCosts } = useSimulatorModelCosts();
  const { data: yachtModels, isLoading: loadingModels } = useYachtModels();
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

  // Obter estado do modelo (editado localmente ou do banco)
  const getModelState = (modelId: string): ModelCostState => {
    if (editStates[modelId]) {
      return editStates[modelId];
    }
    const existingCost = costsMap[modelId];
    if (existingCost) {
      return {
        custo_mp_import: existingCost.custo_mp_import,
        custo_mp_nacional: existingCost.custo_mp_nacional,
        custo_mo_horas: existingCost.custo_mo_horas,
        custo_mo_valor_hora: existingCost.custo_mo_valor_hora,
        projeto: existingCost.projeto as "OKEAN" | "Ferretti",
        tax_import_percent: existingCost.tax_import_percent,
      };
    }
    return {
      custo_mp_import: 0,
      custo_mp_nacional: 0,
      custo_mo_horas: 0,
      custo_mo_valor_hora: 55,
      projeto: "OKEAN",
      tax_import_percent: 21,
    };
  };

  // Atualizar estado local
  const updateField = (modelId: string, field: keyof ModelCostState, value: number | string) => {
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
        custo_mp_nacional: state.custo_mp_nacional,
        custo_mo_horas: state.custo_mo_horas,
        custo_mo_valor_hora: state.custo_mo_valor_hora,
        projeto: state.projeto,
        tax_import_percent: state.tax_import_percent,
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
  const calcTotalMO = (state: ModelCostState) => state.custo_mo_horas * state.custo_mo_valor_hora;
  const calcTotalCusto = (state: ModelCostState) =>
    state.custo_mp_import + state.custo_mp_nacional + calcTotalMO(state);

  // Verificar se modelo tem custos configurados
  const isConfigured = (modelId: string) => !!costsMap[modelId];

  // Verificar se há mudanças não salvas
  const hasChanges = (modelId: string) => !!editStates[modelId];

  if (loadingCosts || loadingModels) {
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
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {yachtModels?.map((model) => {
            const state = getModelState(model.id);
            const configured = isConfigured(model.id);
            const changed = hasChanges(model.id);
            const saving = savingId === model.id;

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
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Projeto */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Projeto</Label>
                    <Select
                      value={state.projeto}
                      onValueChange={(v) => updateField(model.id, "projeto", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OKEAN">OKEAN</SelectItem>
                        <SelectItem value="Ferretti">Ferretti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custos de Matéria-Prima */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">MP Importada (R$)</Label>
                      <Input
                        type="number"
                        className="h-9"
                        value={state.custo_mp_import || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateField(model.id, "custo_mp_import", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">MP Nacional (R$)</Label>
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

                  {/* Imposto */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Imposto Importação (%)</Label>
                    <Input
                      type="number"
                      className="h-9"
                      value={state.tax_import_percent || ""}
                      placeholder="21"
                      onChange={(e) =>
                        updateField(model.id, "tax_import_percent", parseFloat(e.target.value) || 21)
                      }
                    />
                  </div>

                  {/* Totais e Botão Salvar */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total MO:</span>{" "}
                      <span className="font-medium">{formatCurrency(calcTotalMO(state))}</span>
                      <span className="mx-2 text-muted-foreground">|</span>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span className="font-bold">{formatCurrency(calcTotalCusto(state))}</span>
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
