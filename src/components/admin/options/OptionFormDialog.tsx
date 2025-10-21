import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOptionCategories } from "@/hooks/useOptions";
import { useAllYachtModels, useOptionYachtModels } from "@/hooks/useOptionYachtModels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const optionSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  base_price: z.number().min(0, "Preço deve ser positivo"),
  delivery_days_impact: z.number().int().min(0),
  is_active: z.boolean(),
});

type OptionFormData = z.infer<typeof optionSchema>;

interface OptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionId?: string;
  initialData?: any;
}

export function OptionFormDialog({
  open,
  onOpenChange,
  optionId,
  initialData,
}: OptionFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  
  const { data: categories } = useOptionCategories();
  const { data: yachtModels } = useAllYachtModels();
  const { data: existingModels, isLoading: loadingModels } = useOptionYachtModels(optionId);

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
      base_price: 0,
      delivery_days_impact: 0,
      is_active: true,
    },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Editing mode - populate with existing data
        reset({
          code: initialData.code || "",
          name: initialData.name || "",
          description: initialData.description || "",
          category_id: initialData.category_id || "",
          base_price: Number(initialData.base_price) || 0,
          delivery_days_impact: Number(initialData.delivery_days_impact) || 0,
          is_active: initialData.is_active ?? true,
        });
      } else {
        // Create mode - reset to empty
        reset({
          code: "",
          name: "",
          description: "",
          category_id: "",
          base_price: 0,
          delivery_days_impact: 0,
          is_active: true,
        });
        setSelectedModelIds([]);
      }
    }
  }, [open, initialData, reset]);

  // Load existing yacht models when editing
  useEffect(() => {
    if (existingModels && existingModels.length > 0) {
      setSelectedModelIds(existingModels.map((m: any) => m.yacht_model_id));
    } else if (!optionId) {
      setSelectedModelIds([]);
    }
  }, [existingModels, optionId]);

  const saveMutation = useMutation({
    mutationFn: async (data: OptionFormData) => {
      if (optionId) {
        // Update existing option
        const { error: updateError } = await supabase
          .from("options")
          .update(data)
          .eq("id", optionId);

        if (updateError) throw updateError;

        // Delete existing relationships
        await supabase
          .from("option_yacht_models")
          .delete()
          .eq("option_id", optionId);

        // Insert new relationships
        if (selectedModelIds.length > 0) {
          const { error: relationError } = await supabase
            .from("option_yacht_models")
            .insert(
              selectedModelIds.map((modelId) => ({
                option_id: optionId,
                yacht_model_id: modelId,
              }))
            );

          if (relationError) throw relationError;
        }
      } else {
        // Create new option
        const insertData = {
          code: data.code,
          name: data.name,
          description: data.description || null,
          category_id: data.category_id,
          base_price: data.base_price,
          delivery_days_impact: data.delivery_days_impact || 0,
          is_active: data.is_active,
        };

        const { data: newOption, error: createError } = await supabase
          .from("options")
          .insert([insertData])
          .select()
          .single();

        if (createError) throw createError;

        // Insert relationships
        if (selectedModelIds.length > 0 && newOption) {
          const { error: relationError } = await supabase
            .from("option_yacht_models")
            .insert(
              selectedModelIds.map((modelId) => ({
                option_id: newOption.id,
                yacht_model_id: modelId,
              }))
            );

          if (relationError) throw relationError;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: optionId ? "Opcional atualizado" : "Opcional criado",
        description: "As alterações foram salvas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["options"] });
      queryClient.invalidateQueries({ queryKey: ["option-yacht-models"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar opcional",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleModel = (modelId: string) => {
    setSelectedModelIds((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const onSubmit = (data: OptionFormData) => {
    saveMutation.mutate(data);
  };

  const isActive = watch("is_active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {optionId ? "Editar Opcional" : "Novo Opcional"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do opcional. Selecione os modelos de iates compatíveis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="Ex: ELET-TV-43"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria *</Label>
              <Select
                value={watch("category_id")}
                onValueChange={(value) => setValue("category_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
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
                <p className="text-sm text-destructive">
                  {errors.category_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder='Ex: TV 43" no salão com lift elétrico'
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register("description")}
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
                {...register("base_price", { valueAsNumber: true })}
              />
              {errors.base_price && (
                <p className="text-sm text-destructive">
                  {errors.base_price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_days_impact">Impacto no Prazo (dias)</Label>
              <Input
                id="delivery_days_impact"
                type="number"
                {...register("delivery_days_impact", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Modelos Compatíveis</Label>
            <p className="text-sm text-muted-foreground">
              Selecione os modelos de iates onde este opcional pode ser aplicado
            </p>
            
            {loadingModels ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando modelos...
              </div>
            ) : yachtModels && yachtModels.length > 0 ? (
              <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
                {yachtModels.map((model) => (
                  <div key={model.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`model-${model.id}`}
                      checked={selectedModelIds.includes(model.id)}
                      onCheckedChange={() => toggleModel(model.id)}
                    />
                    <label
                      htmlFor={`model-${model.id}`}
                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                    >
                      <span>{model.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {model.code}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum modelo de iate cadastrado. Crie modelos primeiro.
              </p>
            )}
            
            {selectedModelIds.length === 0 && (
              <p className="text-sm text-amber-600">
                ⚠️ Sem modelos selecionados, este opcional não aparecerá em nenhum configurador
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Opcional ativo</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {optionId ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
