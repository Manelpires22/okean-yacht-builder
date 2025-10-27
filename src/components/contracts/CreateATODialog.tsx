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
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useCreateATO } from "@/hooks/useATOs";

const atoSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  price_impact: z.number().default(0),
  delivery_days_impact: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

type ATOFormData = z.infer<typeof atoSchema>;

interface CreateATODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
}

export function CreateATODialog({
  open,
  onOpenChange,
  contractId,
}: CreateATODialogProps) {
  const [step, setStep] = useState(1);
  const { mutate: createATO, isPending } = useCreateATO();

  const form = useForm<ATOFormData>({
    resolver: zodResolver(atoSchema),
    defaultValues: {
      title: "",
      description: "",
      price_impact: 0,
      delivery_days_impact: 0,
      notes: "",
    },
  });

  const onSubmit = (data: ATOFormData) => {
    const payload: any = {
      contract_id: contractId,
      title: data.title,
      description: data.description,
      price_impact: data.price_impact,
      delivery_days_impact: data.delivery_days_impact,
      notes: data.notes,
    };

    createATO(payload, {
      onSuccess: () => {
        form.reset();
        setStep(1);
        onOpenChange(false);
      },
    });
  };

  const handleNext = async () => {
    const fields = step === 1 ? ["title", "description"] : ["price_impact", "delivery_days_impact"];
    const isValid = await form.trigger(fields as any);
    if (isValid) setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const steps = [
    { number: 1, title: "Informações Básicas" },
    { number: 2, title: "Impacto Financeiro" },
    { number: 3, title: "Revisão e Confirmação" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova ATO (Additional To Order)</DialogTitle>
          <DialogDescription>
            Crie um aditivo ao contrato para modificações ou configurações extras
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step >= s.number
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  {step > s.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{s.number}</span>
                  )}
                </div>
                <span className="text-xs mt-1 text-center">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    step > s.number ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da ATO *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Definição de Acabamentos Internos"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Título descritivo do aditivo ao contrato
                      </FormDescription>
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
                          placeholder="Descreva as modificações ou configurações deste ATO"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Financial Impact */}
            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="price_impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impacto no Preço (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor positivo (acréscimo) ou negativo (redução). Zero se não houver custo.
                      </FormDescription>
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
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Dias adicionais necessários para concluir esta modificação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Internas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas adicionais para equipe interna"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">Revisar ATO</h3>

                  <div>
                    <p className="text-sm text-muted-foreground">Título</p>
                    <p className="font-semibold">{form.watch("title")}</p>
                  </div>

                  {form.watch("description") && (
                    <div>
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="text-sm">{form.watch("description")}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Impacto Preço</p>
                      <p className="font-semibold">
                        <Badge variant={form.watch("price_impact") > 0 ? "default" : "secondary"}>
                          {form.watch("price_impact") > 0 ? "+" : ""}
                          R$ {form.watch("price_impact").toFixed(2)}
                        </Badge>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Impacto Prazo</p>
                      <p className="font-semibold">
                        <Badge variant="outline">
                          +{form.watch("delivery_days_impact")} dias
                        </Badge>
                      </p>
                    </div>
                  </div>

                  {form.watch("notes") && (
                    <div>
                      <p className="text-sm text-muted-foreground">Observações</p>
                      <p className="text-sm">{form.watch("notes")}</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Atenção:</strong> Se o impacto financeiro ou de prazo ultrapassar limites,
                    esta ATO será enviada para aprovação antes de ser aplicada ao contrato.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between">
              <div>
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setStep(1);
                    onOpenChange(false);
                  }}
                >
                  Cancelar
                </Button>

                {step < 3 ? (
                  <Button type="button" onClick={handleNext}>
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar ATO
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
