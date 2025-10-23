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
import { YachtModelOptionsTab } from "@/components/admin/yacht-models/YachtModelOptionsTab";
import { useState } from "react";

export default function AdminYachtModelEdit() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

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
      is_active: model.is_active ?? true,
      length_overall: model.length_overall ? model.length_overall.toString() : "",
      beam: model.beam ? model.beam.toString() : "",
      draft: model.draft ? model.draft.toString() : "",
      height_from_waterline: model.height_from_waterline ? model.height_from_waterline.toString() : "",
      dry_weight: model.dry_weight ? model.dry_weight.toString() : "",
      fuel_capacity: model.fuel_capacity ? model.fuel_capacity.toString() : "",
      water_capacity: model.water_capacity ? model.water_capacity.toString() : "",
      passengers_capacity: model.passengers_capacity ? model.passengers_capacity.toString() : "",
      max_speed: model.max_speed ? model.max_speed.toString() : "",
      cruise_speed: model.cruise_speed ? model.cruise_speed.toString() : "",
      range_nautical_miles: model.range_nautical_miles ? model.range_nautical_miles.toString() : "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: YachtModelFullValues) => {
      const { data, error } = await supabase
        .from('yacht_models')
        .update({
          code: values.code,
          name: values.name,
          description: values.description || null,
          image_url: values.image_url || null,
          base_price: values.base_price ? parseFloat(values.base_price) : null,
          base_delivery_days: values.base_delivery_days ? parseInt(values.base_delivery_days) : null,
          is_active: values.is_active,
          length_overall: values.length_overall ? parseFloat(values.length_overall) : null,
          beam: values.beam ? parseFloat(values.beam) : null,
          draft: values.draft ? parseFloat(values.draft) : null,
          height_from_waterline: values.height_from_waterline ? parseFloat(values.height_from_waterline) : null,
          dry_weight: values.dry_weight ? parseFloat(values.dry_weight) : null,
          fuel_capacity: values.fuel_capacity ? parseFloat(values.fuel_capacity) : null,
          water_capacity: values.water_capacity ? parseFloat(values.water_capacity) : null,
          passengers_capacity: values.passengers_capacity ? parseInt(values.passengers_capacity) : null,
          max_speed: values.max_speed ? parseFloat(values.max_speed) : null,
          cruise_speed: values.cruise_speed ? parseFloat(values.cruise_speed) : null,
          range_nautical_miles: values.range_nautical_miles ? parseFloat(values.range_nautical_miles) : null,
        })
        .eq('id', modelId)
        .select()
        .single();

      if (error) throw error;
      return data;
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
          
          {(activeTab === 'basic' || activeTab === 'specs') && (
            <Button onClick={form.handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="specs">Especificações</TabsTrigger>
            <TabsTrigger value="memorial">Memorial</TabsTrigger>
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

          <TabsContent value="options">
            <YachtModelOptionsTab yachtModelId={modelId!} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
