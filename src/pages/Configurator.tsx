import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModelSelector } from "@/components/configurator/ModelSelector";
import { MemorialDescritivo } from "@/components/configurator/MemorialDescritivo";
import { OptionCategorySection } from "@/components/configurator/OptionCategorySection";
import { ConfigurationSummary } from "@/components/configurator/ConfigurationSummary";
import { SaveQuotationDialog } from "@/components/configurator/SaveQuotationDialog";
import { FreeCustomizationDialog } from "@/components/configurator/FreeCustomizationDialog";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { useOptionCategories, useOptions } from "@/hooks/useOptions";
import { useYachtModels } from "@/hooks/useYachtModels";
import { useSaveQuotation } from "@/hooks/useSaveQuotation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Configurator() {
  const navigate = useNavigate();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [freeCustomizationDialogOpen, setFreeCustomizationDialogOpen] = useState(false);
  
  const {
    state,
    setYachtModel,
    addOption,
    removeOption,
    setBaseDiscount,
    setOptionsDiscount,
    addCustomization,
    removeCustomization,
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

  const handleAddFreeCustomization = (data: {
    item_name: string;
    notes: string;
    image_url?: string;
  }) => {
    addCustomization({
      memorial_item_id: `free-${Date.now()}`, // Generate unique ID for free customizations
      item_name: data.item_name,
      notes: data.notes,
      image_url: data.image_url,
      is_free_customization: true,
    });
    toast.success("Customização adicionada com sucesso");
  };

  const handleRemoveFreeCustomization = (itemId: string) => {
    removeCustomization(itemId);
    toast.success("Customização removida");
  };

  const freeCustomizations = state.customizations.filter(c => c.is_free_customization);
  const memorialCustomizations = state.customizations.filter(c => !c.is_free_customization);

  const handleSaveQuotation = async (formData: {
    client_id?: string;
    client_name: string;
    client_email?: string;
    client_phone?: string;
    base_discount_percentage?: number;
    options_discount_percentage?: number;
    notes?: string;
  }) => {
    if (!state.yacht_model_id) return;

    await saveQuotation.mutateAsync({
      yacht_model_id: state.yacht_model_id,
      base_price: state.base_price,
      base_delivery_days: state.base_delivery_days,
      selected_options: state.selected_options,
      customizations: state.customizations,
      client_id: formData.client_id,
      client_name: formData.client_name,
      client_email: formData.client_email,
      client_phone: formData.client_phone,
      base_discount_percentage: state.base_discount_percentage,
      options_discount_percentage: state.options_discount_percentage,
      notes: formData.notes,
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="base">Modelo Base</TabsTrigger>
                <TabsTrigger value="options">
                  Opcionais
                  {state.selected_options.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {state.selected_options.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="custom">
                  Customizações
                  {freeCustomizations.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {freeCustomizations.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="base" className="space-y-6 mt-6">
                {selectedModel && (
                  <MemorialDescritivo
                    yachtModelId={selectedModel.id}
                    modelName={selectedModel.name}
                    customizations={memorialCustomizations}
                    onAddCustomization={addCustomization}
                    onRemoveCustomization={removeCustomization}
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

              <TabsContent value="custom" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Customizações Personalizadas</h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione modificações ou equipamentos não previstos no memorial descritivo
                      </p>
                    </div>
                    <Button onClick={() => setFreeCustomizationDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Customização
                    </Button>
                  </div>

                  {freeCustomizations.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {freeCustomizations.map((customization) => (
                        <Card key={customization.memorial_item_id}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-base">
                                  {customization.item_name}
                                </CardTitle>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFreeCustomization(customization.memorial_item_id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {customization.image_url && (
                              <img
                                src={customization.image_url}
                                alt={customization.item_name}
                                className="w-full h-32 object-cover rounded-md"
                              />
                            )}
                            <CardDescription className="text-sm">
                              {customization.notes}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 pb-6 text-center">
                        <p className="text-muted-foreground">
                          Nenhuma customização personalizada adicionada ainda.
                          <br />
                          Clique em "Nova Customização" para adicionar.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
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
              baseDiscountPercentage={state.base_discount_percentage}
              optionsDiscountPercentage={state.options_discount_percentage}
              finalBasePrice={totals.finalBasePrice}
              finalOptionsPrice={totals.finalOptionsPrice}
              selectedOptions={state.selected_options}
              optionsData={allOptions}
              customizations={state.customizations}
              onBaseDiscountChange={setBaseDiscount}
              onOptionsDiscountChange={setOptionsDiscount}
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
        baseDiscountPercentage={state.base_discount_percentage}
        optionsDiscountPercentage={state.options_discount_percentage}
        customizationsCount={state.customizations.length}
      />

      <FreeCustomizationDialog
        open={freeCustomizationDialogOpen}
        onOpenChange={setFreeCustomizationDialogOpen}
        onSave={handleAddFreeCustomization}
      />
    </div>
  );
}
