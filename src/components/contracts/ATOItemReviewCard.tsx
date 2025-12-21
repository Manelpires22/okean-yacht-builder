import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/quotation-utils";
import { useApproveATOItem } from "@/hooks/useApproveATOItem";
import { ATOConfigurationWithOrigin, ATOConfigurationItemType } from "@/hooks/useATOConfigurations";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowUpCircle,
  Pencil,
  FileEdit,
  Settings,
  Wrench,
  Plus,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";

interface Material {
  name: string;
  unitCost: number;
  quantity: number;
  total: number;
}

interface ATOItemReviewCardProps {
  config: ATOConfigurationWithOrigin;
  atoId: string;
  isReadOnly?: boolean;
}

const ITEM_TYPE_CONFIG: Record<
  ATOConfigurationItemType,
  { label: string; icon: typeof Package; needsFullAnalysis: boolean }
> = {
  option: { label: "Opcional", icon: Package, needsFullAnalysis: false },
  upgrade: { label: "Upgrade", icon: ArrowUpCircle, needsFullAnalysis: false },
  memorial_item: { label: "Memorial", icon: Wrench, needsFullAnalysis: false },
  ato_item: { label: "Item ATO", icon: FileEdit, needsFullAnalysis: false },
  free_customization: { label: "Customização", icon: Pencil, needsFullAnalysis: true },
  definable_item: { label: "Definição", icon: Settings, needsFullAnalysis: true },
};

export function ATOItemReviewCard({
  config,
  atoId,
  isReadOnly = false,
}: ATOItemReviewCardProps) {
  const [isOpen, setIsOpen] = useState(config.pm_status === "pending");
  const [showOrigin, setShowOrigin] = useState(false);
  const [deliveryImpactDays, setDeliveryImpactDays] = useState(
    config.delivery_impact_days || 0
  );
  const [notes, setNotes] = useState(config.pm_notes || "");
  const [isFeasible, setIsFeasible] = useState<string>("yes");

  // Campos para customizações
  const [materials, setMaterials] = useState<Material[]>(
    (config.materials as Material[]) || []
  );
  const [laborHours, setLaborHours] = useState(config.labor_hours || 0);
  const [laborCostPerHour, setLaborCostPerHour] = useState(
    config.labor_cost_per_hour || 55
  );

  const hasOriginData = config.item_type === "upgrade" && config.upgrade_origin?.memorial_item_name;

  const { mutate: approveItem, isPending } = useApproveATOItem();

  const typeConfig = ITEM_TYPE_CONFIG[config.item_type] || {
    label: "Item",
    icon: Package,
    needsFullAnalysis: false,
  };
  const ItemIcon = typeConfig.icon;
  const needsFullAnalysis = typeConfig.needsFullAnalysis;

  const itemName =
    config.configuration_details?.item_name ||
    config.notes ||
    `Item (${config.item_type})`;
  const itemDescription = config.configuration_details?.description || "";

  // Cálculos de preço para customizações
  const materialsCost = materials.reduce((sum, m) => sum + m.total, 0);
  const laborCost = laborHours * laborCostPerHour;
  const totalCost = materialsCost + laborCost;
  const suggestedPrice = totalCost * 2.33; // Markup ~133%

  const handleApprove = () => {
    if (needsFullAnalysis && isFeasible !== "yes") {
      // Se não é factível, rejeitar com motivo
      approveItem({
        configId: config.id,
        atoId,
        approved: false,
        notes: notes || "Não factível conforme análise do PM",
        deliveryImpactDays: 0,
      });
      return;
    }

    approveItem({
      configId: config.id,
      atoId,
      approved: true,
      deliveryImpactDays,
      notes,
      ...(needsFullAnalysis && {
        materials,
        laborHours,
        laborCostPerHour,
        calculatedPrice: suggestedPrice,
      }),
    });
  };

  const handleReject = () => {
    if (!notes.trim()) {
      return;
    }
    approveItem({
      configId: config.id,
      atoId,
      approved: false,
      notes,
      deliveryImpactDays: 0,
    });
  };

  const addMaterial = () => {
    setMaterials([...materials, { name: "", unitCost: 0, quantity: 1, total: 0 }]);
  };

  const updateMaterial = (index: number, field: keyof Material, value: string | number) => {
    const updated = [...materials];
    if (field === "name") {
      updated[index].name = value as string;
    } else {
      updated[index][field] = Number(value) || 0;
    }
    // Recalcular total
    updated[index].total = updated[index].unitCost * updated[index].quantity;
    setMaterials(updated);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const getStatusBadge = () => {
    switch (config.pm_status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const showApprovalForm = config.pm_status === "pending" && !isReadOnly;

  return (
    <Card className={`transition-all ${config.pm_status === "rejected" ? "border-destructive/50" : config.pm_status === "approved" ? "border-green-500/50" : ""}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 -mx-4 px-4 py-2 rounded-md transition-colors">
              <div className="flex items-center gap-3">
                <ItemIcon className="h-5 w-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{itemName}</span>
                    <Badge variant="outline" className="text-xs">
                      {typeConfig.label}
                    </Badge>
                    {hasOriginData && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowOrigin(!showOrigin);
                              }}
                            >
                              {showOrigin ? (
                                <EyeOff className="h-4 w-4 text-primary" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{showOrigin ? "Ocultar origem" : "Ver item original"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {config.original_price && config.original_price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(config.original_price)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                {config.pm_status === "approved" && config.delivery_impact_days && config.delivery_impact_days > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{config.delivery_impact_days} dias
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Seção de origem do upgrade */}
          {showOrigin && hasOriginData && (
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2 mx-2">
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    Substitui item padrão:
                  </p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {config.upgrade_origin?.memorial_item_name}
                  </p>
                  {config.upgrade_origin?.category_label && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Categoria: {config.upgrade_origin.category_label}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {itemDescription && (
              <p className="text-sm text-muted-foreground">{itemDescription}</p>
            )}

            {/* Formulário de aprovação apenas se pendente */}
            {showApprovalForm && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Análise do PM
                </h4>

                {!needsFullAnalysis ? (
                  /* Formulário simplificado para upgrades/opcionais */
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Impacto no Prazo (dias)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={deliveryImpactDays}
                        onChange={(e) => setDeliveryImpactDays(Number(e.target.value))}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dias adicionais necessários
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observações opcionais..."
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  /* Formulário completo para customizações */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>É factível?</Label>
                      <Select value={isFeasible} onValueChange={setIsFeasible}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Sim, é factível</SelectItem>
                          <SelectItem value="no">Não é factível</SelectItem>
                          <SelectItem value="conditional">Sim, com condições</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isFeasible !== "no" && (
                      <>
                        {/* Materiais */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Materiais Necessários</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addMaterial}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar
                            </Button>
                          </div>

                          {materials.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              Nenhum material adicionado
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {materials.map((mat, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-12 gap-2 items-center"
                                >
                                  <Input
                                    className="col-span-4"
                                    placeholder="Material"
                                    value={mat.name}
                                    onChange={(e) =>
                                      updateMaterial(idx, "name", e.target.value)
                                    }
                                  />
                                  <Input
                                    className="col-span-3"
                                    type="number"
                                    placeholder="R$/un"
                                    value={mat.unitCost || ""}
                                    onChange={(e) =>
                                      updateMaterial(idx, "unitCost", e.target.value)
                                    }
                                  />
                                  <Input
                                    className="col-span-2"
                                    type="number"
                                    placeholder="Qtd"
                                    value={mat.quantity || ""}
                                    onChange={(e) =>
                                      updateMaterial(idx, "quantity", e.target.value)
                                    }
                                  />
                                  <span className="col-span-2 text-sm font-medium">
                                    {formatCurrency(mat.total)}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="col-span-1 px-2"
                                    onClick={() => removeMaterial(idx)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                              <div className="flex justify-end text-sm font-medium pt-2 border-t">
                                Total Materiais: {formatCurrency(materialsCost)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Mão de Obra */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Horas de M.O.</Label>
                            <Input
                              type="number"
                              min={0}
                              value={laborHours || ""}
                              onChange={(e) => setLaborHours(Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>R$/hora</Label>
                            <Input
                              type="number"
                              min={0}
                              value={laborCostPerHour || ""}
                              onChange={(e) => setLaborCostPerHour(Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Total M.O.</Label>
                            <Input
                              value={formatCurrency(laborCost)}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        </div>

                        {/* Resumo de Custos */}
                        <div className="bg-background rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Custo Materiais:</span>
                            <span>{formatCurrency(materialsCost)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Custo M.O.:</span>
                            <span>{formatCurrency(laborCost)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2">
                            <span>Custo Total:</span>
                            <span>{formatCurrency(totalCost)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-primary border-t pt-2">
                            <span>Preço Sugerido (markup 133%):</span>
                            <span>{formatCurrency(suggestedPrice)}</span>
                          </div>
                        </div>

                        {/* Impacto no Prazo */}
                        <div className="space-y-2">
                          <Label>Impacto no Prazo (dias)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={deliveryImpactDays}
                            onChange={(e) => setDeliveryImpactDays(Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                      </>
                    )}

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label>
                        Observações{" "}
                        {isFeasible === "no" && (
                          <span className="text-destructive">*obrigatório</span>
                        )}
                      </Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={
                          isFeasible === "no"
                            ? "Explique por que não é factível..."
                            : "Observações opcionais..."
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleApprove}
                    disabled={isPending || (needsFullAnalysis && isFeasible === "no" && !notes.trim())}
                    className="flex-1"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    {needsFullAnalysis && isFeasible === "no" ? "Rejeitar" : "Aprovar Item"}
                  </Button>
                  {(!needsFullAnalysis || isFeasible !== "no") && (
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isPending || !notes.trim()}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  )}
                </div>

                {!notes.trim() && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Para rejeitar, é necessário preencher as observações
                  </p>
                )}
              </div>
            )}

            {/* Informações de quem aprovou/rejeitou */}
            {config.pm_status !== "pending" && config.pm_notes && (
              <div className="text-sm">
                <Label className="text-muted-foreground">Observações do PM:</Label>
                <p className="mt-1">{config.pm_notes}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
