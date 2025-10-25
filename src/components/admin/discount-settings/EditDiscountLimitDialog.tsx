import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";
import { DiscountLimitConfig, useUpdateDiscountLimit } from "@/hooks/useDiscountLimits";

const limitSchema = z.object({
  no_approval_max: z.number().min(0).max(100),
  director_approval_max: z.number().min(0).max(100),
  admin_approval_required_above: z.number().min(0).max(100),
}).refine(
  (data) => data.director_approval_max >= data.no_approval_max,
  {
    message: "Limite do diretor deve ser maior ou igual ao limite sem aprovação",
    path: ["director_approval_max"],
  }
).refine(
  (data) => data.admin_approval_required_above >= data.director_approval_max,
  {
    message: "Limite do admin deve ser maior ou igual ao limite do diretor",
    path: ["admin_approval_required_above"],
  }
);

type LimitFormValues = z.infer<typeof limitSchema>;

interface EditDiscountLimitDialogProps {
  limit: DiscountLimitConfig;
}

export function EditDiscountLimitDialog({ limit }: EditDiscountLimitDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: updateLimit, isPending } = useUpdateDiscountLimit();

  const form = useForm<LimitFormValues>({
    resolver: zodResolver(limitSchema),
    defaultValues: {
      no_approval_max: limit.no_approval_max,
      director_approval_max: limit.director_approval_max,
      admin_approval_required_above: limit.admin_approval_required_above,
    },
  });

  const onSubmit = (data: LimitFormValues) => {
    updateLimit(
      {
        limit_type: limit.limit_type,
        no_approval_max: data.no_approval_max,
        director_approval_max: data.director_approval_max,
        admin_approval_required_above: data.admin_approval_required_above,
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar Limites
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Editar Limites de Desconto - {limit.limit_type === 'base' ? 'Base do Iate' : 'Opcionais'}
          </DialogTitle>
          <DialogDescription>
            Configure os limites percentuais que determinam quando aprovações são necessárias
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="no_approval_max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto Máximo Sem Aprovação (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Até este valor, o vendedor pode aplicar desconto sem aprovação
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="director_approval_max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto Máximo com Aprovação do Diretor (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Entre o limite sem aprovação e este valor, requer aprovação do Diretor Comercial
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="admin_approval_required_above"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aprovação do Administrador Acima De (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Descontos acima deste valor requerem aprovação do Administrador
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
