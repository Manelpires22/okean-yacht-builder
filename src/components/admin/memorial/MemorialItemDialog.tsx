import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMemorialCategories } from "@/hooks/useMemorialCategories";
import { useJobStops } from "@/hooks/useJobStops";
import { ConfigurableSubItemsEditor, parseSubItems } from "@/components/admin/ConfigurableSubItemsEditor";
import { AIEnrichmentButton, EnrichmentData } from "@/components/admin/AIEnrichmentButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

const UNITS = [
  { value: "unidade", label: "Unidade(s)" },
  { value: "par", label: "Par(es)" },
  { value: "metro", label: "Metro(s)" },
  { value: "litro", label: "Litro(s)" },
  { value: "conjunto", label: "Conjunto(s)" },
  { value: "kg", label: "Quilograma(s)" },
];

const memorialItemSchema = z.object({
  code: z.string().optional(),
  category_id: z.string().uuid("Selecione uma categoria válida"),
  item_name: z.string().min(1, "Nome do item é obrigatório"),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  image_url: z.string().optional(),
  quantity: z.number().int().positive("Quantidade deve ser positiva").default(1),
  unit: z.string().default("unidade"),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  is_customizable: z.boolean().default(true),
  is_configurable: z.boolean().default(false),
  has_upgrades: z.boolean().default(false),
  job_stop_id: z.string().uuid().nullable().optional(),
  configurable_sub_items: z.string().optional(), // JSON string
});

type MemorialItemFormData = z.infer<typeof memorialItemSchema>;

interface MemorialItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yachtModelId: string;
  initialData?: Partial<MemorialItemFormData> & { 
    id?: string; 
    category?: { id: string };
    category_id?: string;
  };
  defaultCategoryId?: string;
}

export function MemorialItemDialog({
  open,
  onOpenChange,
  yachtModelId,
  initialData,
  defaultCategoryId,
}: MemorialItemDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories, isLoading: categoriesLoading } = useMemorialCategories();
  const { data: jobStops } = useJobStops();
  const [categoryOpen, setCategoryOpen] = useState(false);

  const form = useForm<MemorialItemFormData>({
    resolver: zodResolver(memorialItemSchema),
    defaultValues: {
      code: "",
      category_id: defaultCategoryId || "",
      item_name: "",
      description: "",
      brand: "",
      model: "",
      quantity: 1,
      unit: "unidade",
      display_order: 0,
      is_active: true,
      is_customizable: true,
      is_configurable: false,
      has_upgrades: false,
      job_stop_id: null,
      configurable_sub_items: "",
    },
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        // Handle both new shape (category_id) and old shape (category.id)
        const categoryId = initialData.category_id || initialData.category?.id;
        form.reset({
          code: initialData.code || "",
          category_id: categoryId || defaultCategoryId || "",
          item_name: initialData.item_name || "",
          description: initialData.description || "",
          brand: initialData.brand || "",
          model: initialData.model || "",
          quantity: initialData.quantity ?? 1,
          unit: initialData.unit || "unidade",
          display_order: initialData.display_order ?? 0,
          is_active: initialData.is_active ?? true,
          is_customizable: initialData.is_customizable ?? true,
          is_configurable: initialData.is_configurable ?? false,
          has_upgrades: initialData.has_upgrades ?? false,
          job_stop_id: initialData.job_stop_id || null,
          // Convert array to JSON string for the form field
          configurable_sub_items: Array.isArray(initialData.configurable_sub_items)
            ? JSON.stringify(initialData.configurable_sub_items, null, 2)
            : (initialData.configurable_sub_items || ""),
        });
      } else {
        form.reset({
          code: "",
          category_id: defaultCategoryId || "",
          item_name: "",
          description: "",
          brand: "",
          model: "",
          quantity: 1,
          unit: "unidade",
          display_order: 0,
          is_active: true,
          is_customizable: true,
          is_configurable: false,
          has_upgrades: false,
          job_stop_id: null,
          configurable_sub_items: "",
        });
      }
    }
  }, [open, initialData, defaultCategoryId, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: MemorialItemFormData) => {
      // Buscar o value da categoria selecionada para o campo ENUM
      const selectedCategory = categories?.find(c => c.id === data.category_id);
      if (!selectedCategory) {
        throw new Error("Categoria não encontrada");
      }

      const payload = {
        yacht_model_id: yachtModelId,
        code: data.code || null,
        category_id: data.category_id,
        category: selectedCategory.value, // Campo ENUM obrigatório
        item_name: data.item_name,
        description: data.description || null,
        brand: data.brand || null,
        model: data.model || null,
        quantity: data.quantity,
        unit: data.unit,
        display_order: data.display_order,
        is_customizable: data.is_customizable,
        is_active: data.is_active,
        is_configurable: data.is_configurable,
        has_upgrades: data.has_upgrades,
        job_stop_id: data.job_stop_id || null,
        configurable_sub_items: data.configurable_sub_items 
          ? (typeof data.configurable_sub_items === 'string' 
              ? JSON.parse(data.configurable_sub_items) 
              : data.configurable_sub_items)
          : [],
      };

      if (initialData?.id) {
        const { error } = await (supabase as any)
          .from("memorial_items")
          .update(payload)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("memorial_items")
          .insert([payload]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: initialData ? "Item atualizado" : "Item criado",
        description: "As alterações foram salvas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["memorial-items"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MemorialItemFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Item do Memorial" : "Adicionar Item ao Memorial"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do item do memorial descritivo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Categoria *</FormLabel>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={categoryOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={categoriesLoading}
                        >
                          {field.value
                            ? categories?.find((cat) => cat.id === field.value)?.label
                            : "Selecione a categoria"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar categoria..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                          <CommandGroup>
                            {categories?.map((cat) => (
                              <CommandItem
                                key={cat.id}
                                value={cat.label}
                                onSelect={() => {
                                  field.onChange(cat.id);
                                  setCategoryOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === cat.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {cat.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AUD-001" {...field} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="item_name"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Nome do Item *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Motor Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Descrição</FormLabel>
                    <AIEnrichmentButton
                      itemName={form.watch('item_name')}
                      itemType="memorial"
                      currentBrand={form.watch('brand')}
                      currentModel={form.watch('model')}
                      onAccept={(data: EnrichmentData) => {
                        if (data.description) form.setValue('description', data.description);
                        if (data.brand) form.setValue('brand', data.brand);
                        if (data.model) form.setValue('model', data.model);
                        if (data.image_url) form.setValue('image_url', data.image_url);
                      }}
                    />
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do item"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: MAN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: D2676 LE463" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ImageUploadField
              value={form.watch("image_url")}
              onChange={(url) => form.setValue("image_url", url || "")}
              productName={form.watch("item_name")}
              brand={form.watch("brand")}
              model={form.watch("model")}
              folder="options"
              label="Imagem do Item"
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Ordem de exibição dentro da categoria
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_customizable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Item Customizável</FormLabel>
                      <FormDescription>
                        Cliente pode solicitar customização deste item
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_configurable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Item Configurável</FormLabel>
                      <FormDescription>
                        Item precisa ser configurado durante a construção (ex: tecidos, acabamentos)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="has_upgrades"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4 border-primary/30 bg-primary/5">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Possui Upgrades</FormLabel>
                      <FormDescription>
                        Este item pode ser substituído por uma versão superior (upgrade)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("is_configurable") && (
                <FormField
                  control={form.control}
                  name="job_stop_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job-Stop de Definição</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o Job-Stop" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobStops?.map((js) => (
                            <SelectItem key={js.id} value={js.id}>
                              {js.stage} - {js.days_limit} dias - {js.item_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Prazo limite para definição desta configuração
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("is_configurable") && (
                <FormField
                  control={form.control}
                  name="configurable_sub_items"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ConfigurableSubItemsEditor
                          value={parseSubItems(field.value)}
                          onChange={(items) => field.onChange(JSON.stringify(items))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Item Ativo</FormLabel>
                      <FormDescription>Exibir item no memorial descritivo</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {initialData ? "Atualizar" : "Criar"} Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
