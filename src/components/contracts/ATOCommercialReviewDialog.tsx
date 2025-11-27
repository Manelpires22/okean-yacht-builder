import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, DollarSign, Clock, Wrench, AlertTriangle, Send, Info } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";

interface ATOCommercialReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ato: any;
  pmAnalysis: {
    materials: any[];
    total_materials_cost: number;
    labor_hours: number;
    labor_cost_per_hour: number;
    total_labor_cost: number;
    total_cost: number;
    suggested_price: number;
    final_price: number;
  };
  onProceedToSend: (discountPercentage: number) => void;
}

export function ATOCommercialReviewDialog({
  open,
  onOpenChange,
  ato,
  pmAnalysis,
  onProceedToSend,
}: ATOCommercialReviewDialogProps) {
  const [discountPercentage, setDiscountPercentage] = useState(0);

  const basePrice = pmAnalysis.final_price;
  const discountAmount = (basePrice * discountPercentage) / 100;
  const finalPrice = basePrice - discountAmount;

  const needsApproval = discountPercentage > 10;

  const handleProceed = () => {
    onProceedToSend(discountPercentage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Validação Comercial - {ato.ato_number}
          </DialogTitle>
          <DialogDescription>
            Revise a análise técnica do PM e defina o desconto comercial antes de enviar ao cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status do Workflow */}
          <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-200">
              <strong>Workflow PM Completo</strong> - A análise técnica foi concluída e está pronta para validação comercial.
            </AlertDescription>
          </Alert>

          {/* Resumo da Análise PM */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Análise Técnica do PM
              </CardTitle>
              <CardDescription>
                Resumo dos custos e impactos identificados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Materiais */}
              {pmAnalysis.materials && pmAnalysis.materials.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Materiais Necessários:</h4>
                  <div className="space-y-2">
                    {pmAnalysis.materials.map((material: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <span>{material.name}</span>
                        <Badge variant="outline">{formatCurrency(material.cost)}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="font-semibold">Total Materiais:</span>
                    <span className="font-bold text-primary">{formatCurrency(pmAnalysis.total_materials_cost)}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Mão de Obra */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Mão de Obra:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Horas estimadas:</span>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {pmAnalysis.labor_hours}h
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">Custo/hora:</span>
                    <Badge variant="outline">{formatCurrency(pmAnalysis.labor_cost_per_hour)}</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">Total Mão de Obra:</span>
                  <span className="font-bold text-primary">{formatCurrency(pmAnalysis.total_labor_cost)}</span>
                </div>
              </div>

              <Separator />

              {/* Resumo Custos */}
              <div className="space-y-2 bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo Total:</span>
                  <span className="font-semibold">{formatCurrency(pmAnalysis.total_cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço Sugerido PM:</span>
                  <span className="font-semibold">{formatCurrency(pmAnalysis.suggested_price)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold">Preço Base PM:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(pmAnalysis.final_price)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desconto Comercial */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Desconto Comercial
              </CardTitle>
              <CardDescription>
                Aplique desconto adicional se necessário (0-15%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discount">
                  Desconto (%) *
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  max={15}
                  step={0.1}
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Math.min(15, Math.max(0, parseFloat(e.target.value) || 0)))}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Máximo permitido: 15%
                </p>
              </div>

              {needsApproval && (
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 dark:text-orange-200">
                    <strong>Aprovação Comercial Necessária</strong><br/>
                    Descontos acima de 10% requerem aprovação do gerente comercial antes da efetivação.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Preview Preço Final */}
              <div className="space-y-2 bg-gradient-to-br from-blue-50 to-primary/5 dark:from-blue-950/20 dark:to-primary/10 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-900">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço Base PM:</span>
                  <span className="font-semibold">{formatCurrency(basePrice)}</span>
                </div>
                
                {discountPercentage > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto ({discountPercentage.toFixed(1)}%):</span>
                      <span className="font-semibold text-red-600">- {formatCurrency(discountAmount)}</span>
                    </div>
                    <Separator />
                  </>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Preço Final Cliente:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(finalPrice)}</span>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 dark:text-blue-200 text-xs">
                  Este será o preço apresentado ao cliente. Após aprovação dele, este valor será adicionado ao contrato.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleProceed}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="mr-2 h-4 w-4" />
            Prosseguir para Envio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
