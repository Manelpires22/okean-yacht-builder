import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  useCreateMemorialItem,
  useUpdateMemorialItem,
  useMemorialOkeanCategories,
  type MemorialOkeanItem,
} from "@/hooks/useMemorialOkean";

const memorialItemSchema = z.object({
  modelo: z.enum(['FY550', 'FY670', 'FY720', 'FY850'], {
    required_error: "Modelo é obrigatório",
  }),
  categoria: z.string().min(1, "Categoria é obrigatória").max(100),
  descricao_item: z.string().min(1, "Descrição é obrigatória").max(2000),
  tipo_item: z.string().default('Padrão'),
});

type MemorialItemFormData = z.infer<typeof memorialItemSchema>;

interface MemorialOkeanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MemorialOkeanItem;
}

export function MemorialOkeanDialog({
  open,
  onOpenChange,
  item,
}: MemorialOkeanDialogProps) {
  const { data: categories = [] } = useMemorialOkeanCategories();
  const createMutation = useCreateMemorialItem();
  const updateMutation = useUpdateMemorialItem();

  const form = useForm<MemorialItemFormData>({
    resolver: zodResolver(memorialItemSchema),
    defaultValues: {
      modelo: item?.modelo as any || 'FY550',
      categoria: item?.categoria || '',
      descricao_item: item?.descricao_item || '',
      tipo_item: item?.tipo_item || 'Padrão',
    },
  });

  const onSubmit = async (data: MemorialItemFormData) => {
    if (item) {
      await updateMutation.mutateAsync({
        id: item.id,
        modelo: data.modelo,
        categoria: data.categoria,
        descricao_item: data.descricao_item,
        tipo_item: data.tipo_item,
      });
    } else {
      await createMutation.mutateAsync({
        modelo: data.modelo,
        categoria: data.categoria,
        descricao_item: data.descricao_item,
        tipo_item: data.tipo_item,
      });
    }
    onOpenChange(false);
    form.reset();
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar Item' : 'Novo Item'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FY550">FY550</SelectItem>
                        <SelectItem value="FY670">FY670</SelectItem>
                        <SelectItem value="FY720">FY720</SelectItem>
                        <SelectItem value="FY850">FY850</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Item</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Padrão" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
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
              name="descricao_item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Item *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Digite a descrição completa do item..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {item ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
