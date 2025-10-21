import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModelSelector } from "@/components/configurator/ModelSelector";
import { MemorialDescritivo } from "@/components/configurator/MemorialDescritivo";
import { OptionCategorySection } from "@/components/configurator/OptionCategorySection";
import { ConfigurationSummary } from "@/components/configurator/ConfigurationSummary";
import { SaveQuotationDialog } from "@/components/configurator/SaveQuotationDialog";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { useOptionCategories, useOptions } from "@/hooks/useOptions";
import { useYachtModels } from "@/hooks/useYachtModels";
import { useSaveQuotation } from "@/hooks/useSaveQuotation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

export default function Configurator() {
  const navigate = useNavigate();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  const {
    state,
    setYachtModel,
    addOption,
    removeOption,
    totals,
    clearConfiguration,
  } = useConfigurationState();

  const { data: models } = useYachtModels();
  const { data: categories } = useOptionCategories();
  const { data: allOptions } = useOptions();
  const saveQuotation = useSaveQuotation();

  const selectedModel = models?.find((m) => m.id === state.yacht_model_id);
  const selectedOptionIds = state.selected_options.map((o) => o.option_id);

  const handleSelectModel = (
    modelId: string,
    basePrice: number,
    baseDeliveryDays: number
  ) => {
    setYachtModel(modelId, basePrice, baseDeliveryDays);
  };

  const handleToggleOption = (
    optionId: string,
    unitPrice: number,
    deliveryDaysImpact: number
  ) => {
    if (selectedOptionIds.includes(optionId)) {
      removeOption(optionId);
    } else {
      addOption({
        option_id: optionId,
        quantity: 1,
        unit_price: unitPrice,
        delivery_days_impact: deliveryDaysImpact,
      });
    }
  };

  const handleSaveQuotation = async (formData: {
    client_name: string;
    client_email?: string;
    client_phone?: string;
  }) => {
    if (!state.yacht_model_id) return;

    await saveQuotation.mutateAsync({
      yacht_model_id: state.yacht_model_id,
      base_price: state.base_price,
      base_delivery_days: state.base_delivery_days,
      selected_options: state.selected_options,
      client_name: formData.client_name,
      client_email: formData.client_email,
      client_phone: formData.client_phone,
    });

    setSaveDialogOpen(false);
    clearConfiguration();
    navigate("/");
  };

  if (!state.yacht_model_id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
          </div>
          <ModelSelector onSelect={handleSelectModel} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Deseja realmente voltar? A configuração atual será perdida.")) {
                clearConfiguration();
                navigate("/");
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Configurador de Iates</h1>
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="base" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="base">Modelo Base</TabsTrigger>
                <TabsTrigger value="options">
                  Opcionais
                  {state.selected_options.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {state.selected_options.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="base" className="space-y-6 mt-6">
                {selectedModel && (
                  <MemorialDescritivo
                    specifications={selectedModel.technical_specifications}
                    modelName={selectedModel.name}
                  />
                )}
              </TabsContent>

              <TabsContent value="options" className="space-y-6 mt-6">
                {categories && categories.length > 0 ? (
                  <OptionCategorySection
                    categories={categories}
                    selectedOptionIds={selectedOptionIds}
                    onToggleOption={handleToggleOption}
                    yachtModelId={state.yacht_model_id}
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Nenhuma categoria de opcionais disponível
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <ConfigurationSummary
              modelName={selectedModel?.name || ""}
              basePrice={state.base_price}
              optionsPrice={totals.optionsPrice}
              totalPrice={totals.totalPrice}
              baseDeliveryDays={state.base_delivery_days}
              totalDeliveryDays={totals.totalDeliveryDays}
              selectedOptions={state.selected_options}
              optionsData={allOptions}
              onSave={() => setSaveDialogOpen(true)}
            />
          </div>
        </div>
      </div>

      <SaveQuotationDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveQuotation}
        isLoading={saveQuotation.isPending}
      />
    </div>
  );
}
