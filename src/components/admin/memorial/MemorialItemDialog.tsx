import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: 'dimensoes', label: 'Dimensões' },
  { value: 'motorizacao', label: 'Motorização' },
  { value: 'sistema_eletrico', label: 'Sistema Elétrico' },
  { value: 'sistema_hidraulico', label: 'Sistema Hidráulico' },
  { value: 'acabamentos', label: 'Acabamentos' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'conforto', label: 'Conforto' },
  { value: 'outros', label: 'Outros' },
];

const UNITS = [
  { value: 'unidade', label: 'Unidade(s)' },
  { value: 'par', label: 'Par(es)' },
  { value: 'metro', label: 'Metro(s)' },
  { value: 'litro', label: 'Litro(s)' },
  { value: 'conjunto', label: 'Conjunto(s)' },
  { value: 'kg', label: 'Quilograma(s)' },
];

const memorialItemSchema = z.object({
  category: z.enum(['dimensoes', 'motorizacao', 'sistema_eletrico', 'sistema_hidraulico', 'acabamentos', 'equipamentos', 'seguranca', 'conforto', 'outros']),
  item_name: z.string().min(1, "Nome do item é obrigatório").max(200),
  description: z.string().max(500).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  quantity: z.number().int().min(1, "Quantidade deve ser no mínimo 1"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  display_order: z.number().int().min(0),
  category_display_order: z.number().int().min(0).default(999),
  is_customizable: z.boolean(),
  is_active: z.boolean(),
});

type MemorialItemFormData = z.infer<typeof memorialItemSchema>;

interface MemorialItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yachtModelId: string;
  initialData?: any;
  defaultCategory?: string;
}

export function MemorialItemDialog({
  open,
  onOpenChange,
  yachtModelId,
  initialData,
  defaultCategory,
}: MemorialItemDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MemorialItemFormData>({
    resolver: zodResolver(memorialItemSchema),
    defaultValues: {
      category: (defaultCategory || 'dimensoes') as MemorialItemFormData['category'],
      item_name: "",
      description: "",
      brand: "",
      model: "",
      quantity: 1,
      unit: "unidade",
      display_order: 0,
      category_display_order: 999,
      is_customizable: true,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          category: initialData.category as MemorialItemFormData['category'],
          item_name: initialData.item_name || "",
          description: initialData.description || "",
          brand: initialData.brand || "",
          model: initialData.model || "",
          quantity: initialData.quantity || 1,
          unit: initialData.unit || "unidade",
          display_order: initialData.display_order || 0,
          category_display_order: initialData.category_display_order || 999,
          is_customizable: initialData.is_customizable ?? true,
          is_active: initialData.is_active ?? true,
        });
      } else {
        form.reset({
          category: (defaultCategory || 'dimensoes') as MemorialItemFormData['category'],
          item_name: "",
          description: "",
          brand: "",
          model: "",
          quantity: 1,
          unit: "unidade",
          display_order: 0,
          category_display_order: 999,
          is_customizable: true,
          is_active: true,
        });
      }
    }
  }, [open, initialData, defaultCategory, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: MemorialItemFormData) => {
      const payload = {
        yacht_model_id: yachtModelId,
        category: data.category,
        category_display_order: data.category_display_order,
        item_name: data.item_name,
        description: data.description || null,
        brand: data.brand || null,
        model: data.model || null,
        quantity: data.quantity,
        unit: data.unit,
        display_order: data.display_order,
        is_customizable: data.is_customizable,
        is_active: data.is_active,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('memorial_items')
          .update(payload)
          .eq('id', initialData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('memorial_items')
          .insert([payload]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: initialData ? "Item atualizado" : "Item criado",
        description: "As alterações foram salvas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['memorial-items'] });
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
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
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Item *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Motor Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
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
                        {UNITS.map(unit => (
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem da Categoria</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="999 (final da lista)"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 999)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Define a ordem de exibição da categoria. Menor = aparece primeiro. Padrão: 999 (final).
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_customizable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Item Customizável
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Cliente pode solicitar customização deste item
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Item Ativo
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Exibir item no memorial descritivo
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
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
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {initialData ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
