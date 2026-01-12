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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HullNumber, useUpdateHullNumber } from "@/hooks/useHullNumbers";
import { HullProgressTimeline } from "./HullProgressTimeline";
import { useYachtModels } from "@/hooks/useYachtModels";
import { Pencil, Ship, Calendar, Wrench, TestTube } from "lucide-react";

const formSchema = z.object({
  brand: z.string().min(1, "Informe a marca"),
  yacht_model_id: z.string().uuid("Selecione um modelo"),
  hull_number: z.string().min(1, "Informe a matrícula").max(20, "Máximo 20 caracteres"),
  hull_entry_date: z.string().min(1, "Informe a data de entrada"),
  estimated_delivery_date: z.string().min(1, "Informe a data de entrega"),
  status: z.enum(['available', 'contracted']),
  // Job Stops
  job_stop_1_date: z.string().nullable().optional(),
  job_stop_2_date: z.string().nullable().optional(),
  job_stop_3_date: z.string().nullable().optional(),
  job_stop_4_date: z.string().nullable().optional(),
  // Production milestones
  barco_aberto_date: z.string().nullable().optional(),
  fechamento_convesdeck_date: z.string().nullable().optional(),
  barco_fechado_date: z.string().nullable().optional(),
  // Tests
  teste_piscina_date: z.string().nullable().optional(),
  teste_mar_date: z.string().nullable().optional(),
  entrega_comercial_date: z.string().nullable().optional(),
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
      status: "available",
      job_stop_1_date: "",
      job_stop_2_date: "",
      job_stop_3_date: "",
      job_stop_4_date: "",
      barco_aberto_date: "",
      fechamento_convesdeck_date: "",
      barco_fechado_date: "",
      teste_piscina_date: "",
      teste_mar_date: "",
      entrega_comercial_date: "",
    },
  });

  useEffect(() => {
    if (hullNumber) {
      // Normalize status: treat 'reserved' as 'available'
      const normalizedStatus = hullNumber.status === 'contracted' ? 'contracted' : 'available';
      form.reset({
        brand: hullNumber.brand,
        yacht_model_id: hullNumber.yacht_model_id,
        hull_number: hullNumber.hull_number,
        hull_entry_date: hullNumber.hull_entry_date,
        estimated_delivery_date: hullNumber.estimated_delivery_date,
        status: normalizedStatus,
        job_stop_1_date: hullNumber.job_stop_1_date || "",
        job_stop_2_date: hullNumber.job_stop_2_date || "",
        job_stop_3_date: hullNumber.job_stop_3_date || "",
        job_stop_4_date: hullNumber.job_stop_4_date || "",
        barco_aberto_date: hullNumber.barco_aberto_date || "",
        fechamento_convesdeck_date: hullNumber.fechamento_convesdeck_date || "",
        barco_fechado_date: hullNumber.barco_fechado_date || "",
        teste_piscina_date: hullNumber.teste_piscina_date || "",
        teste_mar_date: hullNumber.teste_mar_date || "",
        entrega_comercial_date: hullNumber.entrega_comercial_date || "",
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
      status: data.status,
      job_stop_1_date: data.job_stop_1_date || null,
      job_stop_2_date: data.job_stop_2_date || null,
      job_stop_3_date: data.job_stop_3_date || null,
      job_stop_4_date: data.job_stop_4_date || null,
      barco_aberto_date: data.barco_aberto_date || null,
      fechamento_convesdeck_date: data.fechamento_convesdeck_date || null,
      barco_fechado_date: data.barco_fechado_date || null,
      teste_piscina_date: data.teste_piscina_date || null,
      teste_mar_date: data.teste_mar_date || null,
      entrega_comercial_date: data.entrega_comercial_date || null,
    });
    
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Matrícula {hullNumber?.hull_number}
          </DialogTitle>
          <DialogDescription>
            Altere os dados da matrícula e acompanhe o progresso de produção.
          </DialogDescription>
        </DialogHeader>

        {/* Timeline de Progresso */}
        {hullNumber && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <HullProgressTimeline hullNumber={hullNumber} />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-1">
                  <Ship className="h-3 w-3" />
                  <span className="hidden sm:inline">Dados</span>
                </TabsTrigger>
                <TabsTrigger value="jobstops" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">Job Stops</span>
                </TabsTrigger>
                <TabsTrigger value="production" className="flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  <span className="hidden sm:inline">Produção</span>
                </TabsTrigger>
                <TabsTrigger value="tests" className="flex items-center gap-1">
                  <TestTube className="h-3 w-3" />
                  <span className="hidden sm:inline">Testes</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab: Dados Básicos */}
              <TabsContent value="basic" className="space-y-4 mt-4">
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              Disponível
                            </span>
                          </SelectItem>
                          <SelectItem value="contracted">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                              Contratada
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tab: Job Stops */}
              <TabsContent value="jobstops" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="job_stop_1_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Stop 1</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="job_stop_2_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Stop 2</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="job_stop_3_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Stop 3</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="job_stop_4_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Stop 4</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Tab: Produção */}
              <TabsContent value="production" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="barco_aberto_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barco Aberto</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fechamento_convesdeck_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fechamento Convés/Casaria</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barco_fechado_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barco Fechado</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Tab: Testes e Entrega */}
              <TabsContent value="tests" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="teste_piscina_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teste Piscina (CQ)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teste_mar_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teste Mar (CQ)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entrega_comercial_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entrega Comercial</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

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
