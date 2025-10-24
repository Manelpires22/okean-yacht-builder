import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Save, FileUp } from "lucide-react";
import { toast } from "sonner";
import { yachtModelFullSchema, YachtModelFullValues } from "@/lib/schemas/yacht-model-schema";
import { YachtModelBasicForm } from "@/components/admin/yacht-models/YachtModelBasicForm";
import { YachtModelSpecsForm } from "@/components/admin/yacht-models/YachtModelSpecsForm";
import { ImportDocumentDialog } from "@/components/admin/yacht-models/ImportDocumentDialog";

export default function AdminYachtModelCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Estados para dados extraídos do documento
  const [extractedMemorialItems, setExtractedMemorialItems] = useState<any[]>([]);
  const [extractedOptions, setExtractedOptions] = useState<any[]>([]);

  const form = useForm<YachtModelFullValues>({
    resolver: zodResolver(yachtModelFullSchema),
    defaultValues: {
      is_active: true,
      code: "",
      name: "",
      description: "",
      image_url: "",
      base_price: "",
      base_delivery_days: "",
      registration_number: "",
      delivery_date: "",
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (values: YachtModelFullValues) => {
      // 1. Criar o modelo primeiro
      const { data: model, error: modelError } = await supabase
        .from('yacht_models')
        .insert({
          code: values.code,
          name: values.name,
          description: values.description || null,
          image_url: values.image_url || null,
          base_price: values.base_price ? parseFloat(values.base_price) : null,
          base_delivery_days: values.base_delivery_days ? parseInt(values.base_delivery_days) : null,
          registration_number: values.registration_number || null,
          delivery_date: values.delivery_date || null,
          is_active: values.is_active,
          
          // Specifications
          length_overall: values.length_overall ? parseFloat(values.length_overall) : null,
          hull_length: values.hull_length ? parseFloat(values.hull_length) : null,
          beam: values.beam ? parseFloat(values.beam) : null,
          draft: values.draft ? parseFloat(values.draft) : null,
          height_from_waterline: values.height_from_waterline ? parseFloat(values.height_from_waterline) : null,
          dry_weight: values.dry_weight ? parseFloat(values.dry_weight) : null,
          displacement_light: values.displacement_light ? parseFloat(values.displacement_light) : null,
          displacement_loaded: values.displacement_loaded ? parseFloat(values.displacement_loaded) : null,
          fuel_capacity: values.fuel_capacity ? parseFloat(values.fuel_capacity) : null,
          water_capacity: values.water_capacity ? parseFloat(values.water_capacity) : null,
          passengers_capacity: values.passengers_capacity ? parseInt(values.passengers_capacity) : null,
          cabins: values.cabins ? parseInt(values.cabins) : null,
          bathrooms: values.bathrooms || null,
          engines: values.engines || null,
          hull_color: values.hull_color || null,
          max_speed: values.max_speed ? parseFloat(values.max_speed) : null,
          cruise_speed: values.cruise_speed ? parseFloat(values.cruise_speed) : null,
          range_nautical_miles: values.range_nautical_miles ? parseFloat(values.range_nautical_miles) : null,
        })
        .select()
        .single();

      if (modelError) throw modelError;

      // 2. Criar itens de memorial se houver
      if (extractedMemorialItems.length > 0) {
        // Primeiro, buscar o ID da categoria 'outros' como fallback
        const { data: outrosCategory } = await supabase
          .from('memorial_categories')
          .select('id')
          .eq('value', 'outros')
          .single();

        const memorialInserts = extractedMemorialItems.map((item, index) => ({
          yacht_model_id: model.id,
          category: 'outros' as any, // Enum antigo (será removido)
          category_id: outrosCategory?.id || null,
          item_name: item.description?.substring(0, 100) || `Item ${index + 1}`,
          description: item.description || '',
          technical_specs: item.specification ? { spec: item.specification } : null,
          display_order: index,
          is_active: true,
        }));

        const { error: memorialError } = await supabase
          .from('memorial_items')
          .insert(memorialInserts);

        if (memorialError) {
          console.error('Erro ao criar itens de memorial:', memorialError);
          toast.warning(`Modelo criado, mas ${memorialInserts.length} itens de memorial não foram criados`);
        } else {
          toast.success(`${memorialInserts.length} itens de memorial criados!`);
        }
      }

      // 3. Criar opcionais se houver
      if (extractedOptions.length > 0) {
        const optionsInserts = extractedOptions.map((option, index) => ({
          yacht_model_id: model.id,
          code: `${values.code}-OPT${String(index + 1).padStart(3, '0')}`,
          name: option.name || `Opcional ${index + 1}`,
          description: option.description || '',
          base_price: option.price || 0,
          category_id: '00000000-0000-0000-0000-000000000001', // Categoria "Importados"
          is_active: true,
        }));

        const { error: optionsError } = await supabase
          .from('options')
          .insert(optionsInserts);

        if (optionsError) {
          console.error('Erro ao criar opcionais:', optionsError);
          toast.warning(`Modelo criado, mas ${optionsInserts.length} opcionais não foram criados`);
        } else {
          toast.success(`${optionsInserts.length} opcionais criados!`);
        }
      }

      return model;
    },
    onSuccess: (model) => {
      toast.success("Modelo criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['admin-yacht-models'] });
      
      // Redirecionar para edição onde pode refinar memorial/opcionais
      navigate(`/admin/yacht-models/${model.id}/edit`);
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar modelo", {
        description: error.message,
      });
    },
  });

  const handleImportData = (extractedData: any) => {
    console.log('Dados extraídos do documento:', extractedData);

    // 1. Preencher Dados Básicos
    if (extractedData.basic_data) {
      const basic = extractedData.basic_data;
      if (basic.code) form.setValue('code', basic.code);
      if (basic.name) form.setValue('name', basic.name);
      if (basic.description) form.setValue('description', basic.description);
      if (basic.base_price) form.setValue('base_price', basic.base_price.toString());
      if (basic.base_delivery_days) form.setValue('base_delivery_days', basic.base_delivery_days.toString());
      if (basic.registration_number) form.setValue('registration_number', basic.registration_number);
      if (basic.delivery_date) form.setValue('delivery_date', basic.delivery_date);
    }

    // 2. Preencher Especificações
    if (extractedData.specifications) {
      const specs = extractedData.specifications;
      Object.entries(specs).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          form.setValue(key as any, value.toString());
        }
      });
    }

    // 3. Guardar memorial_items e options para criar quando salvar
    if (extractedData.memorial_items?.length > 0) {
      setExtractedMemorialItems(extractedData.memorial_items);
    }
    
    if (extractedData.options?.length > 0) {
      setExtractedOptions(extractedData.options);
    }

    // 4. Mostrar resumo
    const memorialCount = extractedData.memorial_items?.length || 0;
    const optionsCount = extractedData.options?.length || 0;
    const fieldsCount = 
      Object.keys(extractedData.basic_data || {}).filter(k => extractedData.basic_data[k]).length +
      Object.keys(extractedData.specifications || {}).filter(k => extractedData.specifications[k]).length;

    toast.success("Documento processado com sucesso!", {
      description: `${fieldsCount} campos, ${memorialCount} itens de memorial, ${optionsCount} opcionais identificados`,
    });
  };

  const onSubmit = (values: YachtModelFullValues) => {
    createModelMutation.mutate(values);
  };

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
              <h1 className="text-3xl font-bold">Novo Modelo de Iate</h1>
              <p className="text-muted-foreground">
                Preencha os dados manualmente ou importe um documento
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Importar Documento
            </Button>

            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={createModelMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {createModelMutation.isPending ? "Criando..." : "Criar Modelo"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="specs">Especificações</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <TabsContent value="basic" className="space-y-4">
              <YachtModelBasicForm form={form} />
            </TabsContent>

            <TabsContent value="specs" className="space-y-4">
              <YachtModelSpecsForm form={form} />
            </TabsContent>
          </Form>
        </Tabs>

        <ImportDocumentDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onDataExtracted={handleImportData}
        />
      </div>
    </AdminLayout>
  );
}
