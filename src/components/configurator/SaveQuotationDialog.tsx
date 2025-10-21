import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const saveQuotationSchema = z.object({
  client_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  client_email: z.string().email("Email inválido").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  notes: z.string().optional(),
});

type SaveQuotationFormValues = z.infer<typeof saveQuotationSchema>;

interface SaveQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SaveQuotationFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function SaveQuotationDialog({
  open,
  onOpenChange,
  onSave,
  isLoading,
}: SaveQuotationDialogProps) {
  const form = useForm<SaveQuotationFormValues>({
    resolver: zodResolver(saveQuotationSchema),
    defaultValues: {
      client_name: "",
      client_email: "",
      client_phone: "",
      notes: "",
    },
  });

  const handleSubmit = async (data: SaveQuotationFormValues) => {
    await onSave(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Salvar Cotação</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente para salvar esta configuração como cotação
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente *</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="joao@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="+55 11 99999-9999" {...field} />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre a cotação..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Cotação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
