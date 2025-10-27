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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emailSchema = z.object({
  recipient_email: z.string().email("Email inválido").optional(),
  recipient_name: z.string().optional(),
  message: z.string().max(500, "Mensagem muito longa").optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface SendContractEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  defaultEmail?: string;
  defaultName?: string;
}

export function SendContractEmailDialog({
  open,
  onOpenChange,
  contractId,
  defaultEmail,
  defaultName,
}: SendContractEmailDialogProps) {
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipient_email: defaultEmail || "",
      recipient_name: defaultName || "",
      message: "",
    },
  });

  const { mutate: sendEmail, isPending } = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const { data: result, error } = await supabase.functions.invoke(
        "send-contract-email",
        {
          body: {
            contract_id: contractId,
            recipient_email: data.recipient_email,
            recipient_name: data.recipient_name,
            message: data.message,
          },
        }
      );

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Email enviado com sucesso!");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Error sending email:", error);
      toast.error("Erro ao enviar email: " + error.message);
    },
  });

  const onSubmit = (data: EmailFormData) => {
    sendEmail(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Contrato por Email
          </DialogTitle>
          <DialogDescription>
            Envie o contrato para o cliente ou outras partes interessadas
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do Destinatário</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="cliente@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Deixe em branco para usar o email do cliente cadastrado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Destinatário (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem Personalizada (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione uma mensagem personalizada ao email..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Máximo 500 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
