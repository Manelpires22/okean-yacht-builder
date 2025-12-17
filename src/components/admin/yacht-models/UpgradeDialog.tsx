import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useJobStops } from "@/hooks/useJobStops";
import { useAllMemorialItemsForUpgrades } from "@/hooks/useMemorialUpgrades";
import { ConfigurableSubItemsEditor, parseSubItems } from "@/components/admin/ConfigurableSubItemsEditor";

const upgradeSchema = z.object({
  memorial_item_id: z.string().uuid("Selecione um item do memorial").nullable().optional(),
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  price: z.number(), // Permite valores negativos (crédito)
  delivery_days_impact: z.number().int().min(0).default(0),
  job_stop_id: z.string().uuid().nullable().optional(),
  is_configurable: z.boolean().default(false),
  configurable_sub_items: z.string().optional(),
  is_customizable: z.boolean().default(true),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
});

type UpgradeFormData = z.infer<typeof upgradeSchema>;

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yachtModelId: string;
  initialData?: any;
  onSubmit: (data: UpgradeFormData) => void;
  isPending?: boolean;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  yachtModelId,
  initialData,
  onSubmit,
  isPending,
}: UpgradeDialogProps) {
  const { data: memorialItems, isLoading: memorialItemsLoading } = useAllMemorialItemsForUpgrades(yachtModelId);
  const { data: jobStops } = useJobStops();
  const [memorialItemOpen, setMemorialItemOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar itens baseado na busca (mínimo 3 caracteres)
  const filteredMemorialItems = useMemo(() => {
    if (!memorialItems || searchQuery.length < 3) return [];
    
    const query = searchQuery.toLowerCase();
    return memorialItems.filter(item => 
      item.item_name.toLowerCase().includes(query) ||
      item.category?.label?.toLowerCase().includes(query)
    );
  }, [memorialItems, searchQuery]);

  const form = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeSchema),
    defaultValues: {
      memorial_item_id: null,
      code: "",
      name: "",
      description: "",
      brand: "",
      model: "",
      price: 0,
      delivery_days_impact: 0,
      job_stop_id: null,
      is_configurable: false,
      configurable_sub_items: "",
      is_customizable: true,
      is_active: true,
      display_order: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          memorial_item_id: initialData.memorial_item_id || null,
          code: initialData.code || "",
          name: initialData.name || "",
          description: initialData.description || "",
          brand: initialData.brand || "",
          model: initialData.model || "",
          price: Number(initialData.price) || 0,
          delivery_days_impact: initialData.delivery_days_impact || 0,
          job_stop_id: initialData.job_stop_id || null,
          is_configurable: initialData.is_configurable ?? false,
          configurable_sub_items: Array.isArray(initialData.configurable_sub_items)
            ? JSON.stringify(initialData.configurable_sub_items, null, 2)
            : (initialData.configurable_sub_items || ""),
          is_customizable: initialData.is_customizable ?? true,
          is_active: initialData.is_active ?? true,
          display_order: initialData.display_order || 0,
        });
      } else {
        form.reset({
          memorial_item_id: null,
          code: "",
          name: "",
          description: "",
          brand: "",
          model: "",
          price: 0,
          delivery_days_impact: 0,
          job_stop_id: null,
          is_configurable: false,
          configurable_sub_items: "",
          is_customizable: true,
          is_active: true,
          display_order: 0,
        });
      }
    }
  }, [open, initialData, form]);

  const handleFormSubmit = (data: UpgradeFormData) => {
    onSubmit(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Upgrade" : "Criar Upgrade"}
          </DialogTitle>
          <DialogDescription>
            Upgrade substitui ou melhora um item do memorial padrão. O preço informado é o valor adicional (delta).
          </DialogDescription>
        </DialogHeader>

        {/* Alert para upgrade pendente de vinculação */}
        {initialData && !initialData.memorial_item_id && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription>
              Este upgrade está <strong>pendente de vinculação</strong>. 
              Selecione um item do memorial para que ele apareça no configurador.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="memorial_item_id"
              render={({ field }) => {
                const selectedItem = memorialItems?.find(item => item.id === field.value);
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Item do Memorial
                      {!field.value && (
                        <Badge variant="outline" className="ml-2 text-xs text-warning border-warning">
                          Pendente
                        </Badge>
                      )}
                    </FormLabel>
                    <Popover 
                      open={memorialItemOpen} 
                      onOpenChange={(open) => {
                        setMemorialItemOpen(open);
                        if (!open) setSearchQuery("");
                      }}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={memorialItemOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={memorialItemsLoading}
                          >
                            {selectedItem ? (
                              <span className="truncate">
                                {selectedItem.item_name}
                                {selectedItem.category && ` (${selectedItem.category.label})`}
                              </span>
                            ) : (
                              "Buscar item do memorial..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full max-w-[500px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Digite ao menos 3 caracteres..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            {searchQuery.length < 3 ? (
                              <CommandEmpty>
                                Digite ao menos 3 caracteres para buscar...
                              </CommandEmpty>
                            ) : filteredMemorialItems.length === 0 ? (
                              <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {filteredMemorialItems.map((item) => (
                                  <CommandItem
                                    key={item.id}
                                    value={item.id}
                                    onSelect={() => {
                                      field.onChange(item.id);
                                      setMemorialItemOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === item.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="flex-1 truncate">{item.item_name}</span>
                                    {item.category && (
                                      <span className="text-muted-foreground ml-2">
                                        ({item.category.label})
                                      </span>
                                    )}
                                    {item.upgrade_count > 0 && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        {item.upgrade_count}
                                      </Badge>
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Vincule a um item do memorial para aparecer no configurador. Sem vínculo, o upgrade fica como pendente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: UPG-OK57-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Upgrade *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Motor V12 Premium" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do upgrade"
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
                      <Input placeholder="Ex: V12-1650" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Delta (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : Math.round(value * 100) / 100);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value < 0 ? (
                        <span className="text-green-600 font-medium">
                          💰 Crédito: {formatCurrency(Math.abs(field.value))}
                        </span>
                      ) : (
                        "Valor adicional (positivo) ou crédito (negativo)"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_days_impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impacto no Prazo (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
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
                      <FormLabel className="text-base">Upgrade Customizável</FormLabel>
                      <FormDescription>
                        Cliente pode solicitar customização deste upgrade
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
                      <FormLabel className="text-base">Upgrade Configurável</FormLabel>
                      <FormDescription>
                        Upgrade precisa ser configurado durante a construção
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
                      <FormLabel className="text-base">Upgrade Ativo</FormLabel>
                      <FormDescription>Exibir upgrade no configurador</FormDescription>
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
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
