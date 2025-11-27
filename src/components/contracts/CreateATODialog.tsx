import { useState, useEffect } from "react";
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
import { Loader2, ChevronLeft, ChevronRight, Check, Plus } from "lucide-react";
import { useCreateATO } from "@/hooks/useATOs";
import { useContractItems } from "@/hooks/useContractItems";
import { ATOItemSelector } from "./ato-creation/ATOItemSelector";
import { ATOItemsList, PendingATOItem } from "./ato-creation/ATOItemsList";
import { SelectContractItemDialog } from "./ato-creation/SelectContractItemDialog";
import { SelectAvailableOptionDialog } from "./ato-creation/SelectAvailableOptionDialog";
import { NewCustomizationForm } from "./ato-creation/NewCustomizationForm";
import { SelectDefinableItemDialog } from "./ato-creation/SelectDefinableItemDialog";

const atoSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type ATOFormData = z.infer<typeof atoSchema>;

interface CreateATODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  reversalOf?: {
    atoNumber: string;
    title: string;
    priceImpact: number;
    deliveryDaysImpact: number;
  };
}

export function CreateATODialog({
  open,
  onOpenChange,
  contractId,
  reversalOf,
}: CreateATODialogProps) {
  const [step, setStep] = useState(1);
  const [pendingItems, setPendingItems] = useState<PendingATOItem[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [currentDialog, setCurrentDialog] = useState<string | null>(null);

  const { mutate: createATO, isPending } = useCreateATO();
  const { data: contractData } = useContractItems(open ? contractId : undefined);

  const form = useForm<ATOFormData>({
    resolver: zodResolver(atoSchema),
    defaultValues: {
      title: reversalOf ? `Estorno - ${reversalOf.title}` : "",
      description: reversalOf 
        ? `Estorno da ${reversalOf.atoNumber}. Esta ATO cancela os itens previamente aprovados.`
        : "",
      notes: reversalOf ? `Referência: ${reversalOf.atoNumber}` : "",
    },
  });

  // Reset form quando dialog abrir ou reversalOf mudar
  useEffect(() => {
    if (open) {
      form.reset({
        title: reversalOf ? `Estorno - ${reversalOf.title}` : "",
        description: reversalOf 
          ? `Estorno da ${reversalOf.atoNumber}. Esta ATO cancela os itens previamente aprovados.`
          : "",
        notes: reversalOf ? `Referência: ${reversalOf.atoNumber}` : "",
      });
      setStep(1);
      setPendingItems([]);
    }
  }, [open, reversalOf, form]);

  const handleAddItem = (item: PendingATOItem) => {
    setPendingItems([...pendingItems, item]);
    setShowItemSelector(false);
  };

  const handleRemoveItem = (id: string) => {
    setPendingItems(pendingItems.filter((item) => item.id !== id));
  };

  const handleSelectType = (type: PendingATOItem["type"]) => {
    setShowItemSelector(false);
    setCurrentDialog(type);
  };

  const onSubmit = (data: ATOFormData) => {
    // Calcular impactos totais dos itens
    const totalEstimatedPrice = pendingItems.reduce(
      (sum, item) => sum + (item.estimated_price || 0),
      0
    );
    const maxEstimatedDays = Math.max(
      ...pendingItems.map((item) => item.estimated_days || 0),
      0
    );

    // Criar configurações para os itens
    const configurations = pendingItems.map((item) => ({
      item_type: item.type === "add_optional" ? "option" : "memorial_item",
      item_id: item.item_id || null,
      configuration_details: {
        type: item.type,
        notes: item.notes,
        quantity: item.quantity,
      },
      sub_items: [],
      notes: item.notes,
    }));

    const payload: any = {
      contract_id: contractId,
      title: data.title,
      description: data.description,
      price_impact: totalEstimatedPrice,
      delivery_days_impact: maxEstimatedDays,
      notes: data.notes,
      workflow_status: "pending_pm_review", // Sempre usar workflow simplificado
      configurations,
    };

    createATO(payload, {
      onSuccess: () => {
        handleCloseDialog();
      },
    });
  };

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await form.trigger(["title", "description"]);
      if (isValid) setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCloseDialog = () => {
    form.reset();
    setStep(1);
    setPendingItems([]);
    setShowItemSelector(false);
    setCurrentDialog(null);
    onOpenChange(false);
  };

  const steps = [
    { number: 1, title: "Informações Básicas" },
    { number: 2, title: "Adicionar Itens" },
    { number: 3, title: "Revisão e Confirmação" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova ATO (Additional To Order)</DialogTitle>
            <DialogDescription>
              Crie um aditivo ao contrato com múltiplos itens
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
                            placeholder="Ex: Definição de Acabamentos e Adicionais"
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
                            placeholder="Descreva o objetivo geral deste ATO"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 border rounded-lg bg-primary/10">
                    <p className="text-sm">
                      <strong>Workflow:</strong> Esta ATO será enviada para análise do PM, que retornará com preço e prazo finais.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Add Items */}
              {step === 2 && (
                <div className="space-y-6">
                  {!showItemSelector ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Itens da ATO</h3>
                          <p className="text-sm text-muted-foreground">
                            Adicione todos os itens que farão parte deste aditivo
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setShowItemSelector(true)}
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Item
                        </Button>
                      </div>

                      <ATOItemsList items={pendingItems} onRemove={handleRemoveItem} />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Escolha o Tipo de Item</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowItemSelector(false)}
                        >
                          Voltar para Lista
                        </Button>
                      </div>
                      <ATOItemSelector onSelectType={handleSelectType} />
                    </>
                  )}
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

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Itens</p>
                      <Badge variant="outline">
                        {pendingItems.length} {pendingItems.length === 1 ? "item" : "itens"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Impacto Estimado</p>
                        <p className="font-semibold">
                          <Badge variant="default">
                            R${" "}
                            {pendingItems
                              .reduce((sum, item) => sum + (item.estimated_price || 0), 0)
                              .toFixed(2)}
                          </Badge>
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Prazo Estimado</p>
                        <p className="font-semibold">
                          <Badge variant="outline">
                            +
                            {Math.max(
                              ...pendingItems.map((item) => item.estimated_days || 0),
                              0
                            )}{" "}
                            dias
                          </Badge>
                        </p>
                      </div>
                    </div>
                  </div>

                  {pendingItems.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Resumo dos Itens:</h4>
                      <ATOItemsList items={pendingItems} onRemove={() => {}} />
                    </div>
                  )}

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm">
                      <strong>Nota:</strong> Esta ATO será enviada para análise do PM, que retornará com preço e prazo finais.
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
                    onClick={handleCloseDialog}
                  >
                    Cancelar
                  </Button>

                  {step < 3 ? (
                    <Button type="button" onClick={handleNext}>
                      Próximo
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isPending || pendingItems.length === 0}>
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

      {/* Dialogs de Seleção */}
      {contractData?.contract && (
        <>
          <SelectContractItemDialog
            open={currentDialog === "edit_existing"}
            onOpenChange={(open) => !open && setCurrentDialog(null)}
            contractId={contractId}
            onAdd={handleAddItem}
          />

          <SelectAvailableOptionDialog
            open={currentDialog === "add_optional"}
            onOpenChange={(open) => !open && setCurrentDialog(null)}
            yachtModelId={contractData.contract.yacht_model_id}
            onAdd={handleAddItem}
          />

          <NewCustomizationForm
            open={currentDialog === "new_customization"}
            onOpenChange={(open) => !open && setCurrentDialog(null)}
            onAdd={handleAddItem}
          />

          <SelectDefinableItemDialog
            open={currentDialog === "define_finishing"}
            onOpenChange={(open) => !open && setCurrentDialog(null)}
            yachtModelId={contractData.contract.yacht_model_id}
            onAdd={handleAddItem}
          />
        </>
      )}
    </>
  );
}
