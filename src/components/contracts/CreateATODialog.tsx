import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ChevronLeft, ChevronRight, Check, Plus, Percent, DollarSign } from "lucide-react";
import { useCreateATO } from "@/hooks/useATOs";
import { useContractItems } from "@/hooks/useContractItems";
import { ATOItemSelector } from "./ato-creation/ATOItemSelector";
import { ATOItemsList, PendingATOItem } from "./ato-creation/ATOItemsList";
import { SelectContractItemDialog } from "./ato-creation/SelectContractItemDialog";
import { SelectAvailableOptionDialog } from "./ato-creation/SelectAvailableOptionDialog";
import { SelectAvailableUpgradeDialog } from "./ato-creation/SelectAvailableUpgradeDialog";
import { NewCustomizationForm } from "./ato-creation/NewCustomizationForm";
import { SelectDefinableItemDialog } from "./ato-creation/SelectDefinableItemDialog";
import { formatCurrency } from "@/lib/quotation-utils";

// Schema simplificado - título agora é automático
const atoSchema = z.object({
  description: z.string().optional(),
  notes: z.string().optional(),
});

type ATOFormData = z.infer<typeof atoSchema>;
type DiscountType = "percentage" | "fixed";

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
  
  // Estado para desconto da ATO
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);

  const { mutate: createATO, isPending } = useCreateATO();
  const { data: contractData } = useContractItems(open ? contractId : undefined);

  // Buscar próximo número da ATO
  const { data: existingATOs } = useQuery({
    queryKey: ['ato-next-number', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("additional_to_orders")
        .select("sequence_number")
        .eq("contract_id", contractId)
        .order("sequence_number", { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Calcular próximo número e título automático
  const nextATONumber = (existingATOs?.[0]?.sequence_number || 0) + 1;
  const autoTitle = reversalOf ? `Estorno - ${reversalOf.title}` : `ATO ${nextATONumber}`;

  const form = useForm<ATOFormData>({
    resolver: zodResolver(atoSchema),
    defaultValues: {
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
        description: reversalOf 
          ? `Estorno da ${reversalOf.atoNumber}. Esta ATO cancela os itens previamente aprovados.`
          : "",
        notes: reversalOf ? `Referência: ${reversalOf.atoNumber}` : "",
      });
      setStep(1);
      setPendingItems([]);
      setDiscountType("percentage");
      setDiscountValue(0);
    }
  }, [open, reversalOf, form]);

  // Calcular preço final com descontos
  const { totalOriginalPrice, totalWithItemDiscounts, finalPrice, atoDiscountAmount } = useMemo(() => {
    // Soma dos preços originais dos itens
    const totalOriginal = pendingItems.reduce(
      (sum, item) => sum + (item.original_price || item.estimated_price || 0),
      0
    );
    
    // Soma com descontos individuais aplicados
    const withItemDiscounts = pendingItems.reduce((sum, item) => {
      const price = item.original_price || item.estimated_price || 0;
      const discount = item.discount_percentage || 0;
      return sum + price * (1 - discount / 100);
    }, 0);
    
    // Desconto da ATO (% ou valor fixo)
    let atoDiscount = 0;
    if (discountType === "percentage" && discountValue > 0) {
      atoDiscount = withItemDiscounts * (discountValue / 100);
    } else if (discountType === "fixed" && discountValue > 0) {
      atoDiscount = Math.min(discountValue, withItemDiscounts);
    }
    
    return {
      totalOriginalPrice: totalOriginal,
      totalWithItemDiscounts: withItemDiscounts,
      finalPrice: withItemDiscounts - atoDiscount,
      atoDiscountAmount: atoDiscount,
    };
  }, [pendingItems, discountType, discountValue]);

  const handleAddItem = (item: PendingATOItem) => {
    // Garantir que original_price esteja sempre definido
    const itemWithOriginalPrice = {
      ...item,
      original_price: item.original_price || item.estimated_price || 0,
    };
    setPendingItems([...pendingItems, itemWithOriginalPrice]);
    setShowItemSelector(false);
  };

  const handleRemoveItem = (id: string) => {
    setPendingItems(pendingItems.filter((item) => item.id !== id));
  };

  const handleUpdateItemDiscount = (id: string, discount: number) => {
    setPendingItems(
      pendingItems.map((item) =>
        item.id === id
          ? {
              ...item,
              discount_percentage: discount,
              estimated_price: (item.original_price || item.estimated_price || 0) * (1 - discount / 100),
            }
          : item
      )
    );
  };

  const handleSelectType = (type: PendingATOItem["type"]) => {
    setShowItemSelector(false);
    setCurrentDialog(type);
  };

  const onSubmit = (data: ATOFormData) => {
    const maxEstimatedDays = Math.max(
      ...pendingItems.map((item) => item.estimated_days || 0),
      0
    );

    // Criar configurações para os itens (com desconto individual)
    const configurations = pendingItems.map((item) => ({
      item_type: item.type === "add_optional" ? "option" : item.type === "add_upgrade" ? "upgrade" : "memorial_item",
      item_id: item.item_id || null,
      configuration_details: {
        type: item.type,
        notes: item.notes,
        quantity: item.quantity,
        item_name: item.item_name,
      },
      sub_items: [],
      notes: item.notes,
      discount_percentage: item.discount_percentage || 0,
      original_price: item.original_price || item.estimated_price || 0,
    }));

    const payload: any = {
      contract_id: contractId,
      title: autoTitle,
      description: data.description,
      price_impact: finalPrice,
      original_price_impact: totalOriginalPrice,
      delivery_days_impact: maxEstimatedDays,
      notes: data.notes,
      workflow_status: "pending_pm_review",
      discount_percentage: discountType === "percentage" ? discountValue : 0,
      discount_amount: discountType === "fixed" ? discountValue : 0,
      configurations,
    };

    createATO(payload, {
      onSuccess: () => {
        handleCloseDialog();
      },
    });
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleCloseDialog = () => {
    form.reset();
    setStep(1);
    setPendingItems([]);
    setShowItemSelector(false);
    setCurrentDialog(null);
    onOpenChange(false);
  };

  // Apenas 2 etapas agora
  const steps = [
    { number: 1, title: "Adicionar Itens" },
    { number: 2, title: "Revisão e Confirmação" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova ATO: {autoTitle}</DialogTitle>
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
              {/* Step 1: Add Items (antes era step 2) */}
              {step === 1 && (
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

                      <ATOItemsList 
                        items={pendingItems} 
                        onRemove={handleRemoveItem}
                        onUpdateDiscount={handleUpdateItemDiscount}
                      />
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

              {/* Step 2: Review (antes era step 3) */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">Revisar ATO</h3>

                    <div>
                      <p className="text-sm text-muted-foreground">Título</p>
                      <p className="font-semibold">{autoTitle}</p>
                    </div>

                    {/* Campo de descrição opcional movido para revisão */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Adicione detalhes sobre esta ATO..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Itens</p>
                      <Badge variant="outline">
                        {pendingItems.length} {pendingItems.length === 1 ? "item" : "itens"}
                      </Badge>
                    </div>

                    {/* Seção de Desconto da ATO */}
                    <div className="border rounded-lg p-4 space-y-4 bg-background">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-semibold">Desconto da ATO</h4>
                      </div>

                      <RadioGroup
                        value={discountType}
                        onValueChange={(value) => setDiscountType(value as DiscountType)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="percentage" id="discount-percentage" />
                          <Label htmlFor="discount-percentage" className="flex items-center gap-1 cursor-pointer">
                            <Percent className="h-3 w-3" />
                            Percentual
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="discount-fixed" />
                          <Label htmlFor="discount-fixed" className="flex items-center gap-1 cursor-pointer">
                            <DollarSign className="h-3 w-3" />
                            Valor Fixo
                          </Label>
                        </div>
                      </RadioGroup>

                      <div className="flex items-center gap-3">
                        <Label className="text-sm text-muted-foreground">
                          {discountType === "percentage" ? "Desconto (%)" : "Desconto (R$)"}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={discountType === "percentage" ? 100 : totalWithItemDiscounts}
                          step={discountType === "percentage" ? 0.5 : 100}
                          className="w-32"
                          value={discountValue || ""}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          placeholder={discountType === "percentage" ? "0%" : "R$ 0,00"}
                        />
                      </div>

                      {discountValue > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Desconto aplicado: <span className="text-destructive font-medium">{formatCurrency(atoDiscountAmount)}</span>
                        </p>
                      )}
                    </div>

                    {/* Resumo de Preços */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Preço Original</p>
                        <p className="text-muted-foreground line-through">
                          {formatCurrency(totalOriginalPrice)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Preço Final</p>
                        <p className="font-semibold text-lg text-primary">
                          {formatCurrency(finalPrice)}
                        </p>
                        {(totalOriginalPrice - finalPrice) > 0 && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Economia: {formatCurrency(totalOriginalPrice - finalPrice)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Prazo Estimado</p>
                      <Badge variant="outline">
                        +{Math.max(...pendingItems.map((item) => item.estimated_days || 0), 0)} dias
                      </Badge>
                    </div>
                  </div>

                  {pendingItems.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Resumo dos Itens:</h4>
                      <ATOItemsList items={pendingItems} onRemove={() => {}} readOnly />
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

                  {step < 2 ? (
                    <Button type="button" onClick={handleNext} disabled={pendingItems.length === 0}>
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

          <SelectAvailableUpgradeDialog
            open={currentDialog === "add_upgrade"}
            onOpenChange={(open) => !open && setCurrentDialog(null)}
            yachtModelId={contractData.contract.yacht_model_id}
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
