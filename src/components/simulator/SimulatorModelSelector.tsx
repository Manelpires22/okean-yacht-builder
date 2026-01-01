import { ArrowLeft, ArrowRight, Ship, Globe, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulatorModelCosts, useSimulatorBusinessRules } from "@/hooks/useSimulatorConfig";
import { AppHeader } from "@/components/AppHeader";
import { Currency } from "@/hooks/useSimulatorState";

interface SimulatorModelSelectorProps {
  sellerName: string;
  onSelect: (model: {
    id: string;
    name: string;
    code: string;
    isExportable: boolean;
    custoMpImport: number;
    custoMpImportCurrency: Currency;
    custoMpNacional: number;
    custoMoHoras: number;
    custoMoValorHora: number;
    taxImportPercent: number;
    salesTaxPercent: number;
    warrantyPercent: number;
  }) => void;
  onBack: () => void;
}

export function SimulatorModelSelector({ sellerName, onSelect, onBack }: SimulatorModelSelectorProps) {
  const { data: modelCosts, isLoading: isLoadingCosts } = useSimulatorModelCosts();
  const { data: businessRules } = useSimulatorBusinessRules();

  // Get business rules values
  const getRuleValue = (key: string, defaultValue: number) => {
    const rule = businessRules?.find(r => r.rule_key === key);
    return rule?.rule_value ?? defaultValue;
  };

  const handleSelectModel = (cost: NonNullable<typeof modelCosts>[0]) => {
    const isExportable = cost.is_exportable ?? false;
    
    // Apply business rules based on exportable status
    const salesTaxPercent = isExportable 
      ? getRuleValue("sales_tax_export", 0)
      : getRuleValue("sales_tax_domestic", 21);
    
    const warrantyPercent = isExportable
      ? getRuleValue("warranty_export", 5)
      : getRuleValue("warranty_domestic", 3);

    onSelect({
      id: cost.yacht_model_id,
      name: cost.yacht_model?.name || "Modelo",
      code: cost.yacht_model?.code || "",
      isExportable,
      custoMpImport: cost.custo_mp_import,
      custoMpImportCurrency: (cost.custo_mp_import_currency || "EUR") as Currency,
      custoMpNacional: cost.custo_mp_nacional,
      custoMoHoras: cost.custo_mo_horas,
      custoMoValorHora: cost.custo_mo_valor_hora,
      taxImportPercent: cost.tax_import_percent,
      salesTaxPercent,
      warrantyPercent,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Simulador de Viabilidade" />
      
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
              ✓
            </div>
            <span className="text-muted-foreground">Vendedor</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="font-medium">Modelo</span>
          </div>
        </div>

        {/* Back button and selected seller */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="text-sm text-muted-foreground">
            Vendedor: <span className="font-medium text-foreground">{sellerName}</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Qual modelo será simulado?</h1>
          <p className="text-muted-foreground">
            Selecione o modelo do barco para carregar os custos base
          </p>
        </div>

        {isLoadingCosts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : !modelCosts?.length ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <Ship className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum modelo com custos cadastrados</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre custos em Administração → Simulador → Custos por Modelo
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelCosts.map((cost) => {
              const model = cost.yacht_model;
              const isExportable = cost.is_exportable ?? false;
              
              return (
                <Card
                  key={cost.id}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md group overflow-hidden"
                  onClick={() => handleSelectModel(cost)}
                >
                  {/* Model Image */}
                  <div className="aspect-video bg-muted overflow-hidden">
                    {model?.image_url ? (
                      <img 
                        src={model.image_url} 
                        alt={model.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Ship className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {model?.code || "---"}
                        </p>
                        <h3 className="font-semibold">{model?.name || "Modelo"}</h3>
                      </div>
                      <Badge variant={isExportable ? "secondary" : "outline"} className="shrink-0">
                        {isExportable ? (
                          <>
                            <Globe className="h-3 w-3 mr-1" />
                            Export
                          </>
                        ) : (
                          <>
                            <Home className="h-3 w-3 mr-1" />
                            Nacional
                          </>
                        )}
                      </Badge>
                    </div>
                    
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
