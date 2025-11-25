import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useQuotation } from "@/hooks/useQuotations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/quotation-utils";

export default function Configurator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editQuotationId = searchParams.get('edit');
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [freeCustomizationDialogOpen, setFreeCustomizationDialogOpen] = useState(false);
  
  const {
    state,
    setYachtModel,
    addOption,
    removeOption,
    updateOptionCustomization,
    setBaseDiscount,
    setOptionsDiscount,
    addCustomization,
    removeCustomization,
    totals,
    clearConfiguration,
    loadFromQuotation,
  } = useConfigurationState();

  const { data: models } = useYachtModels();
  const { data: categories } = useOptionCategories();
  const { data: allOptions } = useOptions();
  const saveQuotation = useSaveQuotation();
  
  // Carregar cotação se estiver editando
  const { data: existingQuotation, isLoading: isLoadingQuotation } = useQuotation(editQuotationId || '');

  // Carregar dados da cotação existente no estado
  useEffect(() => {
    if (existingQuotation && editQuotationId && !isLoadingQuotation) {
      loadFromQuotation(existingQuotation);
      toast.success(`Editando cotação ${existingQuotation.quotation_number}`);
    }
  }, [existingQuotation, editQuotationId, isLoadingQuotation]);

  const selectedModel = models?.find((m) => m.id === state.yacht_model_id);

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
    const isSelected = state.selected_options?.some(o => o.option_id === optionId) || false;
    if (isSelected) {
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

  const handleCustomizeOption = (optionId: string, notes: string) => {
    updateOptionCustomization(optionId, notes);
    if (notes) {
      toast.success("Customização do opcional salva");
    } else {
      toast.success("Customização do opcional removida");
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

  const freeCustomizations = state.customizations?.filter(c => c.is_free_customization) || [];
  const memorialCustomizations = state.customizations?.filter(c => !c.is_free_customization) || [];

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
      quotationId: editQuotationId || undefined, // ✅ Passar ID se editando
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
    
    // Redirecionar para detalhes da cotação se editando, senão para lista
    if (editQuotationId) {
      navigate(`/quotations/${editQuotationId}`);
    } else {
      navigate("/cotacoes");
    }
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
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("Deseja realmente voltar? A configuração atual será perdida.")) {
                clearConfiguration();
                navigate("/");
              }
            }}
            size="sm"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center sm:text-left truncate">
            Configurador de Iates
          </h1>
          <div className="hidden sm:block sm:w-20 lg:w-24" /> {/* Spacer for alignment on desktop */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_1fr] 2xl:grid-cols-[4fr_1fr] gap-4 md:gap-6 items-start">
          <div className="min-w-0">
            <Tabs defaultValue="base" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="base" className="text-xs sm:text-sm py-2 px-2">
                  <span className="hidden sm:inline">Modelo Base</span>
                  <span className="sm:hidden">Base</span>
                </TabsTrigger>
                <TabsTrigger value="options" className="text-xs sm:text-sm py-2 px-2 relative">
                  <span className="hidden sm:inline">Opcionais</span>
                  <span className="sm:hidden">Opções</span>
                  {(state.selected_options?.length || 0) > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs h-5 min-w-[20px] px-1 absolute -top-1 -right-1 sm:static">
                      {state.selected_options?.length || 0}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs sm:text-sm py-2 px-2 relative">
                  <span className="hidden sm:inline">Customizações</span>
                  <span className="sm:hidden">Custom</span>
                  {freeCustomizations.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs h-5 min-w-[20px] px-1 absolute -top-1 -right-1 sm:static">
                      {freeCustomizations.length}
                    </Badge>
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
                    selectedOptions={state.selected_options}
                    onToggleOption={handleToggleOption}
                    onCustomizeOption={handleCustomizeOption}
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
                      {freeCustomizations.map((customization) => {
                        const isApproved = customization.workflow_status === 'approved';
                        const hasPrice = customization.pm_final_price && customization.pm_final_price > 0;
                        
                        return (
                          <Card 
                            key={customization.memorial_item_id}
                            className={cn(
                              isApproved && hasPrice && "border-success/30 bg-success/5"
                            )}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CardTitle className="text-base">
                                      {customization.item_name}
                                    </CardTitle>
                                    {isApproved ? (
                                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Aprovado
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pendente
                                      </Badge>
                                    )}
                                  </div>
                                  {hasPrice && (
                                    <p className="text-lg font-semibold text-success">
                                      {formatCurrency(customization.pm_final_price!)}
                                    </p>
                                  )}
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
                              {isApproved && customization.pm_final_delivery_impact_days !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                  {customization.pm_final_delivery_impact_days > 0 
                                    ? `+${customization.pm_final_delivery_impact_days} dias no prazo`
                                    : "Sem impacto no prazo"
                                  }
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
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
              customizationsPrice={totals.customizationsPrice}
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
              onRemoveOption={removeOption}
              onRemoveCustomization={removeCustomization}
              onEditCustomization={(customization) => {
                // Abrir dialog de edição de customização
                setFreeCustomizationDialogOpen(true);
                // TODO: Carregar dados da customização no dialog
              }}
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
        customizationsCount={state.customizations?.filter(c => c.workflow_status !== 'approved').length || 0}
        existingClientData={existingQuotation ? {
          client_id: existingQuotation.client_id || undefined,
          client_name: existingQuotation.client_name,
          client_email: existingQuotation.client_email || undefined,
          client_phone: existingQuotation.client_phone || undefined,
        } : undefined}
      />

      <FreeCustomizationDialog
        open={freeCustomizationDialogOpen}
        onOpenChange={setFreeCustomizationDialogOpen}
        onSave={handleAddFreeCustomization}
      />
    </div>
  );
}
