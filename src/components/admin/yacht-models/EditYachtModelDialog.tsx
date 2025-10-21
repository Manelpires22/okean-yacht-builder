import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { YachtModelForm, yachtModelSchema, YachtModelFormValues } from "./YachtModelForm";

interface EditYachtModelDialogProps {
  model: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditYachtModelDialog({ model, open, onOpenChange }: EditYachtModelDialogProps) {
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

  useEffect(() => {
    if (model && open) {
      form.reset({
        code: model.code || "",
        name: model.name || "",
        description: model.description || "",
        image_url: model.image_url || "",
        base_price: model.base_price ? model.base_price.toString() : "",
        base_delivery_days: model.base_delivery_days ? model.base_delivery_days.toString() : "",
        is_active: model.is_active ?? true,
        technical_specifications: model.technical_specifications 
          ? JSON.stringify(model.technical_specifications, null, 2)
          : "",
      });
    }
  }, [model, open, form]);

  const updateMutation = useMutation({
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
        .update({
          code: values.code,
          name: values.name,
          description: values.description || null,
          image_url: values.image_url || null,
          base_price,
          base_delivery_days,
          is_active: values.is_active,
          technical_specifications,
        })
        .eq('id', model.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-yacht-models'] });
      toast({
        title: "Modelo atualizado",
        description: "O modelo de iate foi atualizado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar modelo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: YachtModelFormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Modelo de Iate</DialogTitle>
          <DialogDescription>
            Edite as informações do modelo {model?.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <YachtModelForm form={form} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
