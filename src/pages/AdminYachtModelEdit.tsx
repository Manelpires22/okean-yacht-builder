import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { yachtModelFullSchema, YachtModelFullValues } from "@/lib/schemas/yacht-model-schema";
import { YachtModelBasicForm } from "@/components/admin/yacht-models/YachtModelBasicForm";
import { YachtModelSpecsForm } from "@/components/admin/yacht-models/YachtModelSpecsForm";
import { YachtModelMemorialTab } from "@/components/admin/yacht-models/YachtModelMemorialTab";
import { YachtModelUpgradesTab } from "@/components/admin/yacht-models/YachtModelUpgradesTab";
import { YachtModelOptionsTab } from "@/components/admin/yacht-models/YachtModelOptionsTab";
import { ImportDocumentDialog } from "@/components/admin/yacht-models/ImportDocumentDialog";
import { useState } from "react";

export default function AdminYachtModelEdit() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: model, isLoading } = useQuery({
    queryKey: ['yacht-model', modelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yacht_models')
        .select('*')
        .eq('id', modelId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!modelId,
  });

  const form = useForm<YachtModelFullValues>({
    resolver: zodResolver(yachtModelFullSchema),
    values: model ? {
      code: model.code || "",
      name: model.name || "",
      description: model.description || "",
      image_url: model.image_url || "",
      base_price: model.base_price ? model.base_price.toString() : "",
      base_delivery_days: model.base_delivery_days ? model.base_delivery_days.toString() : "",
      registration_number: model.registration_number || "",
      delivery_date: model.delivery_date || "",
      is_active: model.is_active ?? true,
      
      // Specifications - Dimensions
      length_overall: model.length_overall ? model.length_overall.toString() : "",
      hull_length: model.hull_length ? model.hull_length.toString() : "",
      beam: model.beam ? model.beam.toString() : "",
      draft: model.draft ? model.draft.toString() : "",
      height_from_waterline: model.height_from_waterline ? model.height_from_waterline.toString() : "",
      
      // Weights and Displacement
      dry_weight: model.dry_weight ? model.dry_weight.toString() : "",
      displacement_light: model.displacement_light ? model.displacement_light.toString() : "",
      displacement_loaded: model.displacement_loaded ? model.displacement_loaded.toString() : "",
      
      // Capacities
      fuel_capacity: model.fuel_capacity ? model.fuel_capacity.toString() : "",
      water_capacity: model.water_capacity ? model.water_capacity.toString() : "",
      passengers_capacity: model.passengers_capacity ? model.passengers_capacity.toString() : "",
      cabins: model.cabins ? model.cabins.toString() : "",
      bathrooms: model.bathrooms || "",
      
      // Engines and Hull
      engines: model.engines || "",
      hull_color: model.hull_color || "",
      
      // Performance
      max_speed: model.max_speed ? model.max_speed.toString() : "",
      cruise_speed: model.cruise_speed ? model.cruise_speed.toString() : "",
      range_nautical_miles: model.range_nautical_miles ? model.range_nautical_miles.toString() : "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: YachtModelFullValues) => {
      const { error } = await supabase
        .from('yacht_models')
        .update({
          code: values.code,
          name: values.name,
          description: values.description || null,
          image_url: values.image_url || null,
          base_price: values.base_price ? parseFloat(values.base_price) : null,
          base_delivery_days: values.base_delivery_days ? parseInt(values.base_delivery_days) : null,
          registration_number: values.registration_number || null,
          delivery_date: values.delivery_date || null,
          is_active: values.is_active,
          
          // Specifications - Dimensions
          length_overall: values.length_overall ? parseFloat(values.length_overall) : null,
          hull_length: values.hull_length ? parseFloat(values.hull_length) : null,
          beam: values.beam ? parseFloat(values.beam) : null,
          draft: values.draft ? parseFloat(values.draft) : null,
          height_from_waterline: values.height_from_waterline ? parseFloat(values.height_from_waterline) : null,
          
          // Weights and Displacement
          dry_weight: values.dry_weight ? parseFloat(values.dry_weight) : null,
          displacement_light: values.displacement_light ? parseFloat(values.displacement_light) : null,
          displacement_loaded: values.displacement_loaded ? parseFloat(values.displacement_loaded) : null,
          
          // Capacities
          fuel_capacity: values.fuel_capacity ? parseFloat(values.fuel_capacity) : null,
          water_capacity: values.water_capacity ? parseFloat(values.water_capacity) : null,
          passengers_capacity: values.passengers_capacity ? parseInt(values.passengers_capacity) : null,
          cabins: values.cabins ? parseInt(values.cabins) : null,
          bathrooms: values.bathrooms || null,
          
          // Engines and Hull
          engines: values.engines || null,
          hull_color: values.hull_color || null,
          
          // Performance
          max_speed: values.max_speed ? parseFloat(values.max_speed) : null,
          cruise_speed: values.cruise_speed ? parseFloat(values.cruise_speed) : null,
          range_nautical_miles: values.range_nautical_miles ? parseFloat(values.range_nautical_miles) : null,
        })
        .eq('id', modelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model', modelId] });
      queryClient.invalidateQueries({ queryKey: ['admin-yacht-models'] });
      toast.success('Modelo atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar modelo: ' + error.message);
    },
  });

  const onSubmit = (values: YachtModelFullValues) => {
    updateMutation.mutate(values);
  };

  const handleImportData = (extractedData: any) => {
    // Aplicar dados básicos
    if (extractedData.basic_data) {
      const basicData = extractedData.basic_data;
      if (basicData.code) form.setValue('code', basicData.code);
      if (basicData.name) form.setValue('name', basicData.name);
      if (basicData.description) form.setValue('description', basicData.description);
      if (basicData.base_price) form.setValue('base_price', basicData.base_price.toString());
      if (basicData.base_delivery_days) form.setValue('base_delivery_days', basicData.base_delivery_days.toString());
      if (basicData.registration_number) form.setValue('registration_number', basicData.registration_number);
      if (basicData.delivery_date) form.setValue('delivery_date', basicData.delivery_date);
    }

    // Aplicar especificações
    if (extractedData.specifications) {
      const specs = extractedData.specifications;
      if (specs.length_overall) form.setValue('length_overall', specs.length_overall.toString());
      if (specs.hull_length) form.setValue('hull_length', specs.hull_length.toString());
      if (specs.beam) form.setValue('beam', specs.beam.toString());
      if (specs.draft) form.setValue('draft', specs.draft.toString());
      if (specs.height_from_waterline) form.setValue('height_from_waterline', specs.height_from_waterline.toString());
      if (specs.dry_weight) form.setValue('dry_weight', specs.dry_weight.toString());
      if (specs.displacement_light) form.setValue('displacement_light', specs.displacement_light.toString());
      if (specs.displacement_loaded) form.setValue('displacement_loaded', specs.displacement_loaded.toString());
      if (specs.fuel_capacity) form.setValue('fuel_capacity', specs.fuel_capacity.toString());
      if (specs.water_capacity) form.setValue('water_capacity', specs.water_capacity.toString());
      if (specs.passengers_capacity) form.setValue('passengers_capacity', specs.passengers_capacity.toString());
      if (specs.cabins) form.setValue('cabins', specs.cabins.toString());
      if (specs.bathrooms) form.setValue('bathrooms', specs.bathrooms);
      if (specs.engines) form.setValue('engines', specs.engines);
      if (specs.hull_color) form.setValue('hull_color', specs.hull_color);
      if (specs.max_speed) form.setValue('max_speed', specs.max_speed.toString());
      if (specs.cruise_speed) form.setValue('cruise_speed', specs.cruise_speed.toString());
      if (specs.range_nautical_miles) form.setValue('range_nautical_miles', specs.range_nautical_miles.toString());
    }

    toast.success(`Dados importados com sucesso! ${Object.keys(extractedData.basic_data || {}).length + Object.keys(extractedData.specifications || {}).length} campos preenchidos.`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/yacht-models')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{model?.name}</h1>
              <p className="text-muted-foreground">{model?.code}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {(activeTab === 'basic' || activeTab === 'specs') && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setImportDialogOpen(true)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4 rotate-90" />
                  Importar Documento
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="specs">Especificações</TabsTrigger>
            <TabsTrigger value="memorial">Memorial</TabsTrigger>
            <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
            <TabsTrigger value="options">Opcionais</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <TabsContent value="basic" className="space-y-4">
              <YachtModelBasicForm form={form} />
            </TabsContent>

            <TabsContent value="specs" className="space-y-4">
              <YachtModelSpecsForm form={form} />
            </TabsContent>
          </Form>

          <TabsContent value="memorial">
            <YachtModelMemorialTab yachtModelId={modelId!} />
          </TabsContent>

          <TabsContent value="upgrades">
            <YachtModelUpgradesTab yachtModelId={modelId!} />
          </TabsContent>

          <TabsContent value="options">
            <YachtModelOptionsTab yachtModelId={modelId!} />
          </TabsContent>
        </Tabs>

        <ImportDocumentDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onDataExtracted={handleImportData}
        />
      </div>
    </AdminLayout>
  );
}
