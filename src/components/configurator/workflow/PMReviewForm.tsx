import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAdvanceCustomizationWorkflow, type CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { CheckCircle2, AlertCircle, Plus, Trash2, Package, Wrench } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CurrencyInput } from "@/components/ui/numeric-input";

interface PMReviewFormProps {
  customization: CustomizationWorkflow;
}

interface Material {
  name: string;
  unitCost: number;
  quantity: number;
}

const DEFAULT_LABOR_COST_PER_HOUR = 55;
const MARKUP_DIVISOR = 0.43; // 1 - 30% - 21% - 3% - 3%

export function PMReviewForm({ customization }: PMReviewFormProps) {
  const [pmScope, setPmScope] = useState(customization.pm_scope || "");
  const [materials, setMaterials] = useState<Material[]>(
    customization.supply_items || []
  );
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialCost, setNewMaterialCost] = useState(0);
  const [newMaterialQty, setNewMaterialQty] = useState(1);
  
  const [laborHours, setLaborHours] = useState(customization.engineering_hours || 0);
  const [laborCostPerHour, setLaborCostPerHour] = useState(DEFAULT_LABOR_COST_PER_HOUR);
  
  const [deliveryImpact, setDeliveryImpact] = useState(customization.pm_final_delivery_impact_days || 0);
  const [notes, setNotes] = useState(customization.pm_final_notes || "");
  
  // Cálculos automáticos
  const totalMaterialsCost = useMemo(() => {
    return materials.reduce((sum, m) => sum + (m.unitCost * m.quantity), 0);
  }, [materials]);

  const totalLaborCost = useMemo(() => {
    return laborHours * laborCostPerHour;
  }, [laborHours, laborCostPerHour]);

  const totalCost = useMemo(() => {
    return totalMaterialsCost + totalLaborCost;
  }, [totalMaterialsCost, totalLaborCost]);

  const suggestedPrice = useMemo(() => {
    const rawPrice = totalCost / MARKUP_DIVISOR;
    return Math.round(rawPrice * 100) / 100; // Arredondar para 2 casas decimais
  }, [totalCost]);

  const [finalPrice, setFinalPrice] = useState(customization.pm_final_price || 0);

  // Atualizar finalPrice quando suggestedPrice mudar
  useMemo(() => {
    if (!customization.pm_final_price) {
      setFinalPrice(suggestedPrice);
    }
  }, [suggestedPrice, customization.pm_final_price]);

  const { mutate: advance, isPending } = useAdvanceCustomizationWorkflow();

  const handleAddMaterial = () => {
    if (newMaterialName.trim() && newMaterialCost > 0 && newMaterialQty > 0) {
      setMaterials([...materials, {
        name: newMaterialName.trim(),
        unitCost: newMaterialCost,
        quantity: newMaterialQty,
      }]);
      setNewMaterialName("");
      setNewMaterialCost(0);
      setNewMaterialQty(1);
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleApprove = () => {
    if (!pmScope || totalCost <= 0 || deliveryImpact < 0) {
      return;
    }

    // Garantir que o preço final tem no máximo 2 casas decimais
    const roundedFinalPrice = Math.round(finalPrice * 100) / 100;

    advance({
      customizationId: customization.id,
      currentStep: 'pm_review',
      action: 'advance',
      data: {
        pm_scope: pmScope,
        pm_final_price: roundedFinalPrice,
        pm_final_delivery_impact_days: deliveryImpact,
        pm_final_notes: notes,
        // Novos campos
        materials: materials,
        total_materials_cost: Math.round(totalMaterialsCost * 100) / 100,
        labor_hours: laborHours,
        labor_cost_per_hour: laborCostPerHour,
        total_labor_cost: Math.round(totalLaborCost * 100) / 100,
        total_cost: Math.round(totalCost * 100) / 100,
        suggested_price: suggestedPrice,
      },
    });
  };

  const handleReject = () => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;

    advance({
      customizationId: customization.id,
      currentStep: 'pm_review',
      action: 'reject',
      data: {
        reject_reason: reason,
      },
    });
  };

  // Breakdown do markup
  const marginValue = totalCost * 0.30;
  const taxValue = totalCost * 0.21;
  const warrantyValue = totalCost * 0.03;
  const commissionValue = totalCost * 0.03;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise PM: Avaliação Completa</CardTitle>
        <CardDescription>
          Defina materiais, mão de obra e prazo. O preço de venda será calculado automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Ao aprovar, uma aprovação comercial pode ser criada automaticamente se o valor ultrapassar os limites configurados.
          </AlertDescription>
        </Alert>

        {/* Escopo Técnico */}
        <div className="space-y-2">
          <Label htmlFor="pm-scope">Escopo Técnico *</Label>
          <Textarea
            id="pm-scope"
            placeholder="Descreva o escopo técnico completo da customização..."
            value={pmScope}
            onChange={(e) => setPmScope(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <Separator />

        {/* Materiais */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">Materiais Necessários</Label>
          </div>
          
          <div className="grid grid-cols-12 gap-2">
            <Input
              placeholder="Nome do material"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
              className="col-span-5"
            />
            <Input
              type="number"
              placeholder="Custo (R$)"
              value={newMaterialCost || ""}
              onChange={(e) => setNewMaterialCost(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="col-span-3"
            />
            <Input
              type="number"
              placeholder="Qtd"
              value={newMaterialQty}
              onChange={(e) => setNewMaterialQty(parseInt(e.target.value) || 1)}
              min="1"
              className="col-span-3"
            />
            <Button type="button" onClick={handleAddMaterial} size="icon" className="col-span-1">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {materials.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(material.unitCost)}</TableCell>
                      <TableCell className="text-right">{material.quantity}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(material.unitCost * material.quantity)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMaterial(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">Total Materiais</TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {formatCurrency(totalMaterialsCost)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <Separator />

        {/* Mão de Obra */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">Mão de Obra</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labor-hours">Horas Necessárias *</Label>
              <Input
                id="labor-hours"
                type="number"
                min="0"
                step="0.5"
                value={laborHours || ""}
                onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="labor-cost">Custo por Hora (R$) *</Label>
              <Input
                id="labor-cost"
                type="number"
                min="0"
                step="1"
                value={laborCostPerHour}
                onChange={(e) => setLaborCostPerHour(parseFloat(e.target.value) || DEFAULT_LABOR_COST_PER_HOUR)}
              />
              <p className="text-xs text-muted-foreground">Default: R$ 55/hora</p>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Mão de Obra:</span>
              <span className="text-lg font-bold">{formatCurrency(totalLaborCost)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {laborHours}h × {formatCurrency(laborCostPerHour)}/h
            </p>
          </div>
        </div>

        <Separator />

        {/* Resumo de Custos e Preço Sugerido */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">💰 Composição do Preço</Label>
          
          <div className="border rounded-lg p-4 space-y-2 bg-card">
            <div className="flex justify-between text-sm">
              <span>Materiais:</span>
              <span className="font-medium">{formatCurrency(totalMaterialsCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Mão de Obra ({laborHours}h × {formatCurrency(laborCostPerHour)}):</span>
              <span className="font-medium">{formatCurrency(totalLaborCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Custo Total:</span>
              <span>{formatCurrency(totalCost)}</span>
            </div>
            
            <Separator className="my-3" />
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>+ Margem (30%):</span>
                <span>{formatCurrency(marginValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Impostos (21%):</span>
                <span>{formatCurrency(taxValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Garantia (3%):</span>
                <span>{formatCurrency(warrantyValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Comissão (3%):</span>
                <span>{formatCurrency(commissionValue)}</span>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
              <span className="font-bold text-lg">💰 Preço Sugerido:</span>
              <span className="font-bold text-2xl text-primary">{formatCurrency(suggestedPrice)}</span>
            </div>
          </div>
        </div>

        {/* Preço Final (editável) */}
        <div className="space-y-2">
          <Label htmlFor="final-price">Preço de Venda Final *</Label>
          <CurrencyInput
            id="final-price"
            value={finalPrice.toString()}
            onChange={(valueStr) => {
              const value = parseFloat(valueStr) || 0;
              // Arredondar para 2 casas decimais
              setFinalPrice(Math.round(value * 100) / 100);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Você pode ajustar o preço sugerido se necessário
          </p>
        </div>

        {/* Impacto no Prazo */}
        <div className="space-y-2">
          <Label htmlFor="delivery-impact">Impacto no Prazo (dias) *</Label>
          <Input
            id="delivery-impact"
            type="number"
            min="0"
            value={deliveryImpact}
            onChange={(e) => setDeliveryImpact(parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Dias adicionais ao prazo base
          </p>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notas ao Vendedor/Cliente (Opcional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informações importantes, observações, restrições..."
            rows={3}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleApprove}
            disabled={isPending || !pmScope || totalCost <= 0 || deliveryImpact < 0}
            className="flex-1"
          >
            {isPending ? "Processando..." : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprovar Customização
              </>
            )}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isPending}
            variant="destructive"
            className="flex-1"
          >
            Rejeitar Customização
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
