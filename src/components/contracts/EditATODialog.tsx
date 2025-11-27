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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateATO } from "@/hooks/useATOs";
import { Loader2, AlertTriangle } from "lucide-react";
import { CurrencyInput } from "@/components/ui/numeric-input";
import { formatCurrency } from "@/lib/formatters";
import { Alert, AlertDescription } from "@/components/ui/alert";

const editATOSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  price_impact: z.number().default(0),
  delivery_days_impact: z.number().int().default(0),
  discount_percentage: z.number().min(0, "Desconto não pode ser negativo").max(100, "Desconto máximo é 100%").default(0),
  notes: z.string().optional(),
});

type EditATOFormData = z.infer<typeof editATOSchema>;

interface EditATODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ato: {
    id: string;
    title: string;
    description?: string | null;
    price_impact: number;
    delivery_days_impact: number;
    discount_percentage: number;
    notes?: string | null;
  };
}

export function EditATODialog({ open, onOpenChange, ato }: EditATODialogProps) {
  const { mutate: updateATO, isPending } = useUpdateATO();

  const form = useForm<EditATOFormData>({
    resolver: zodResolver(editATOSchema),
    defaultValues: {
      title: ato.title,
      description: ato.description || "",
      price_impact: ato.price_impact,
      delivery_days_impact: ato.delivery_days_impact,
      discount_percentage: ato.discount_percentage || 0,
      notes: ato.notes || "",
    },
  });

  const priceImpact = form.watch("price_impact");
  const discountPercentage = form.watch("discount_percentage");
  
  const finalPrice = priceImpact * (1 - discountPercentage / 100);

  const onSubmit = (data: EditATOFormData) => {
    updateATO(
      {
        atoId: ato.id,
        updates: {
          title: data.title,
          description: data.description || null,
          price_impact: data.price_impact,
          delivery_days_impact: data.delivery_days_impact,
          discount_percentage: data.discount_percentage,
          notes: data.notes || null,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar ATO</DialogTitle>
          <DialogDescription>
            Atualize as informações básicas desta ATO
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Customização de Interior" {...field} />
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
                      placeholder="Descreva os detalhes da ATO..."
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
                name="price_impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impacto no Preço</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={String(field.value || 0)}
                        onChange={(value) => field.onChange(parseFloat(value) || 0)}
                        allowNegative
                      />
                    </FormControl>
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
                        value={String(field.value)}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={String(field.value)}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Preço Final</FormLabel>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold">
                  {formatCurrency(finalPrice)}
                </div>
              </div>
            </div>

            {discountPercentage > 10 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Desconto acima de 10% requer aprovação comercial
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Internas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas internas sobre esta ATO..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
