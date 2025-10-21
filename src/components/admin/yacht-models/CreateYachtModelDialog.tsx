import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { YachtModelForm, yachtModelSchema, YachtModelFormValues } from "./YachtModelForm";

export function CreateYachtModelDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<YachtModelFormValues>({
    resolver: zodResolver(yachtModelSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      image_url: "",
      base_price: "",
      base_delivery_days: "",
      is_active: true,
      technical_specifications: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: YachtModelFormValues) => {
      // Parse optional fields
      const base_price = values.base_price ? parseFloat(values.base_price) : null;
      const base_delivery_days = values.base_delivery_days ? parseInt(values.base_delivery_days) : null;
      
      // Parse JSON if provided
      let technical_specifications = null;
      if (values.technical_specifications) {
        try {
          technical_specifications = JSON.parse(values.technical_specifications);
        } catch (e) {
          throw new Error("JSON de especificações técnicas inválido");
        }
      }

      const { data, error } = await supabase
        .from('yacht_models')
        .insert({
          code: values.code,
          name: values.name,
          description: values.description || null,
          image_url: values.image_url || null,
          base_price,
          base_delivery_days,
          is_active: values.is_active,
          technical_specifications,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-yacht-models'] });
      toast({
        title: "Modelo criado",
        description: "O modelo de iate foi criado com sucesso.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar modelo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: YachtModelFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Modelo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Modelo de Iate</DialogTitle>
          <DialogDescription>
            Cadastre um novo modelo de iate com suas especificações básicas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <YachtModelForm form={form} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Salvar Modelo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
