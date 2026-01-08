import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HullNumber, useUpdateHullNumber } from "@/hooks/useHullNumbers";
import { useYachtModels } from "@/hooks/useYachtModels";
import { Pencil } from "lucide-react";

const formSchema = z.object({
  brand: z.string().min(1, "Informe a marca"),
  yacht_model_id: z.string().uuid("Selecione um modelo"),
  hull_number: z.string().min(1, "Informe a matrícula").max(20, "Máximo 20 caracteres"),
  hull_entry_date: z.string().min(1, "Informe a data de entrada"),
  estimated_delivery_date: z.string().min(1, "Informe a data de entrega"),
});

type FormData = z.infer<typeof formSchema>;

interface EditHullNumberDialogProps {
  hullNumber: HullNumber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHullNumberDialog({ hullNumber, open, onOpenChange }: EditHullNumberDialogProps) {
  const { data: yachtModels } = useYachtModels();
  const updateMutation = useUpdateHullNumber();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: "",
      yacht_model_id: "",
      hull_number: "",
      hull_entry_date: "",
      estimated_delivery_date: "",
    },
  });

  useEffect(() => {
    if (hullNumber) {
      form.reset({
        brand: hullNumber.brand,
        yacht_model_id: hullNumber.yacht_model_id,
        hull_number: hullNumber.hull_number,
        hull_entry_date: hullNumber.hull_entry_date,
        estimated_delivery_date: hullNumber.estimated_delivery_date,
      });
    }
  }, [hullNumber, form]);

  const onSubmit = async (data: FormData) => {
    if (!hullNumber) return;
    
    await updateMutation.mutateAsync({
      id: hullNumber.id,
      brand: data.brand,
      yacht_model_id: data.yacht_model_id,
      hull_number: data.hull_number,
      hull_entry_date: data.hull_entry_date,
      estimated_delivery_date: data.estimated_delivery_date,
    });
    
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Matrícula
          </DialogTitle>
          <DialogDescription>
            Altere os dados da matrícula {hullNumber?.hull_number}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="OKEAN" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hull_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="F55008" 
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="yacht_model_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {yachtModels?.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hull_entry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Entrada Casco</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Entrega Prevista</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
