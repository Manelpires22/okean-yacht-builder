import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdvanceCustomizationWorkflow, type CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface SupplyItem {
  part: string;
  supplier: string;
  unit_cost: number;
  quantity: number;
  lead_time_days: number;
}

interface SupplyQuoteFormProps {
  customization: CustomizationWorkflow;
}

export function SupplyQuoteForm({ customization }: SupplyQuoteFormProps) {
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>(customization.supply_items || []);
  const [supplyNotes, setSupplyNotes] = useState(customization.supply_notes || "");
  const [newItem, setNewItem] = useState<SupplyItem>({
    part: "",
    supplier: "",
    unit_cost: 0,
    quantity: 1,
    lead_time_days: 0,
  });

  const { mutate: advance, isPending } = useAdvanceCustomizationWorkflow();

  const totalCost = supplyItems.reduce((sum, item) => sum + (item.unit_cost * item.quantity), 0);
  const maxLeadTime = supplyItems.length > 0 
    ? Math.max(...supplyItems.map(item => item.lead_time_days))
    : 0;

  const handleAddItem = () => {
    if (newItem.part && newItem.supplier && newItem.unit_cost > 0) {
      setSupplyItems([...supplyItems, newItem]);
      setNewItem({
        part: "",
        supplier: "",
        unit_cost: 0,
        quantity: 1,
        lead_time_days: 0,
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setSupplyItems(supplyItems.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (supplyItems.length === 0) {
      return;
    }

    advance({
      customizationId: customization.id,
      currentStep: 'supply_quote',
      action: 'advance',
      data: {
        supply_items: supplyItems,
        supply_cost: totalCost,
        supply_lead_time_days: maxLeadTime,
        supply_notes: supplyNotes,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply: Cotação de Fornecedores</CardTitle>
        <CardDescription>
          Informe custos e prazos de fornecedores. Isso alimenta o Planejamento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Adicionar Item</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Peça/Componente</Label>
              <Input
                value={newItem.part}
                onChange={(e) => setNewItem({ ...newItem, part: e.target.value })}
                placeholder="Ex: Seakeeper 6"
              />
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Input
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <Label>Preço Unitário (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newItem.unit_cost}
                onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Lead Time (dias)</Label>
              <Input
                type="number"
                min="0"
                value={newItem.lead_time_days}
                onChange={(e) => setNewItem({ ...newItem, lead_time_days: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {supplyItems.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2 text-sm">Peça</th>
                  <th className="text-left p-2 text-sm">Fornecedor</th>
                  <th className="text-right p-2 text-sm">Preço</th>
                  <th className="text-right p-2 text-sm">Qtd</th>
                  <th className="text-right p-2 text-sm">Lead Time</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {supplyItems.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2 text-sm">{item.part}</td>
                    <td className="p-2 text-sm">{item.supplier}</td>
                    <td className="p-2 text-sm text-right">{formatCurrency(item.unit_cost)}</td>
                    <td className="p-2 text-sm text-right">{item.quantity}</td>
                    <td className="p-2 text-sm text-right">{item.lead_time_days}d</td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted">
                <tr>
                  <td colSpan={2} className="p-2 font-semibold text-sm">Totais:</td>
                  <td className="p-2 font-bold text-right">{formatCurrency(totalCost)}</td>
                  <td className="p-2"></td>
                  <td className="p-2 font-bold text-right">{maxLeadTime}d</td>
                  <td className="p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="space-y-2">
          <Label>Observações do Comprador</Label>
          <Textarea
            value={supplyNotes}
            onChange={(e) => setSupplyNotes(e.target.value)}
            placeholder="Adicione observações relevantes sobre a cotação..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending || supplyItems.length === 0}
          className="w-full"
        >
          {isPending ? "Processando..." : (
            <>
              Encaminhar para Planejamento <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
