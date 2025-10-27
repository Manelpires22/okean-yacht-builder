import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOptionCategories } from "@/hooks/useOptions";
import { useYachtModels } from "@/hooks/useYachtModels";
import { useJobStops } from "@/hooks/useJobStops";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const optionSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  yacht_model_id: z.string().nullable().optional(),
  base_price: z.number().min(0, "Preço deve ser positivo"),
  delivery_days_impact: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  is_configurable: z.boolean().default(false),
  job_stop_id: z.string().nullable().optional(),
  configurable_sub_items: z.string().optional(), // JSON string
});

type OptionFormData = z.infer<typeof optionSchema>;

interface OptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option?: any | null;
  yachtModelId?: string;
  onSuccess?: () => void;
}

export function OptionDialog({
  open,
  onOpenChange,
  option,
  yachtModelId,
  onSuccess,
}: OptionDialogProps) {
  const queryClient = useQueryClient();
  const { data: categories } = useOptionCategories();
  const { data: models } = useYachtModels();
  const { data: jobStops } = useJobStops();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<OptionFormData>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category_id: "",
      yacht_model_id: yachtModelId || null,
      base_price: 0,
      delivery_days_impact: 0,
      is_active: true,
      is_configurable: false,
      job_stop_id: null,
      configurable_sub_items: "",
    },
  });

  useEffect(() => {
    if (option) {
      reset({
        code: option.code,
        name: option.name,
        description: option.description || "",
        category_id: option.category_id,
        yacht_model_id: option.yacht_model_id || null,
        base_price: Number(option.base_price),
        delivery_days_impact: Number(option.delivery_days_impact),
        is_active: option.is_active,
        is_configurable: option.is_configurable || false,
        job_stop_id: option.job_stop_id || null,
        configurable_sub_items: option.configurable_sub_items 
          ? (typeof option.configurable_sub_items === 'string' 
              ? option.configurable_sub_items 
              : JSON.stringify(option.configurable_sub_items, null, 2))
          : "",
      });
    } else {
      reset({
        code: "",
        name: "",
        description: "",
        category_id: "",
        yacht_model_id: yachtModelId || null,
        base_price: 0,
        delivery_days_impact: 0,
        is_active: true,
        is_configurable: false,
        job_stop_id: null,
        configurable_sub_items: "",
      });
    }
  }, [option, yachtModelId, reset]);

  const createMutation = useMutation({
    mutationFn: async (newOption: OptionFormData) => {
      const { data, error } = await supabase
        .from('options')
        .insert({
          ...newOption,
          yacht_model_id: newOption.yacht_model_id || null,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options'] });
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Opcional criado com sucesso!');
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar opcional: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OptionFormData }) => {
      const { error } = await supabase
        .from('options')
        .update({
          ...data,
          yacht_model_id: data.yacht_model_id || null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options'] });
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Opcional atualizado com sucesso!');
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar opcional: ' + error.message);
    },
  });

  const onSubmit = (data: OptionFormData) => {
    if (option) {
      updateMutation.mutate({ id: option.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedModelId = watch('yacht_model_id');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {option ? 'Editar Opcional' : 'Novo Opcional'}
          </DialogTitle>
          <DialogDescription>
            {option 
              ? 'Atualize as informações do opcional'
              : 'Adicione um novo opcional ao sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="OPT-001"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria *</Label>
              <Select
                value={watch('category_id')}
                onValueChange={(value) => setValue('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-sm text-destructive">{errors.category_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Nome do opcional"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="yacht_model_id">
              Modelo de Iate <span className="text-muted-foreground">(deixe vazio para opcional global)</span>
            </Label>
            <Select
              value={selectedModelId || ""}
              onValueChange={(value) => setValue('yacht_model_id', value === "generic" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional Global (todos os modelos)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generic">
                  🌐 Global (todos os modelos)
                </SelectItem>
                {models?.filter(m => m.is_active).map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição detalhada do opcional"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">Preço Base (R$) *</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                {...register('base_price', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.base_price && (
                <p className="text-sm text-destructive">{errors.base_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_days_impact">Impacto no Prazo (dias)</Label>
              <Input
                id="delivery_days_impact"
                type="number"
                {...register('delivery_days_impact', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.delivery_days_impact && (
                <p className="text-sm text-destructive">{errors.delivery_days_impact.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Opcional ativo</Label>
                <p className="text-sm text-muted-foreground">Exibir opcional no configurador</p>
              </div>
              <Switch
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_configurable">Opcional configurável</Label>
                <p className="text-sm text-muted-foreground">
                  Precisa ser configurado durante a construção
                </p>
              </div>
              <Switch
                id="is_configurable"
                checked={watch('is_configurable')}
                onCheckedChange={(checked) => setValue('is_configurable', checked)}
              />
            </div>

            {watch('is_configurable') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="job_stop_id">Job-Stop de Definição</Label>
                  <Select
                    value={watch('job_stop_id') || ""}
                    onValueChange={(value) => setValue('job_stop_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Job-Stop" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobStops?.map((js) => (
                        <SelectItem key={js.id} value={js.id}>
                          {js.name} - {js.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Prazo limite para definição desta configuração
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="configurable_sub_items">Sub-itens Configuráveis (JSON)</Label>
                  <Textarea
                    id="configurable_sub_items"
                    {...register('configurable_sub_items')}
                    placeholder='[{"name": "Cor", "type": "color"}, {"name": "Material", "type": "text"}]'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    Definição de sub-itens em formato JSON (opcional)
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : option
                ? 'Atualizar'
                : 'Criar Opcional'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
