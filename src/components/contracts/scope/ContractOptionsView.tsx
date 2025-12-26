import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/quotation-utils";
import { Package } from "lucide-react";

interface SelectedOption {
  option_id: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  delivery_days_impact?: number;
  option?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    category?: {
      name: string;
    };
  };
}

interface ContractOptionsViewProps {
  options: SelectedOption[];
}

export function ContractOptionsView({ options }: ContractOptionsViewProps) {
  const totalPrice = options.reduce((sum, opt) => sum + opt.total_price, 0);
  
  // ✅ CORRIGIDO: MAX de dias ao invés de SUM
  const maxDeliveryDays = options.reduce(
    (max, opt) => Math.max(max, opt.delivery_days_impact || 0),
    0
  );

  if (options.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum opcional contratado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Opcionais Contratados</h3>
        <div className="flex gap-2">
          <Badge variant="outline">{options.length} opcionais</Badge>
          <Badge variant="default">{formatCurrency(totalPrice)}</Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {options.map((selectedOption) => (
          <Card key={selectedOption.option_id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {selectedOption.option?.name || "Opcional"}
                  </CardTitle>
                  {selectedOption.option?.code && (
                    <p className="text-sm text-muted-foreground">
                      Código: {selectedOption.option.code}
                    </p>
                  )}
                </div>
                <Badge variant="default" className="text-base px-4 py-1">
                  {formatCurrency(selectedOption.total_price)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedOption.option?.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedOption.option.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  {selectedOption.option?.category && (
                    <div>
                      <strong>Categoria:</strong>{" "}
                      {selectedOption.option.category.name}
                    </div>
                  )}
                  <div>
                    <strong>Quantidade:</strong> {selectedOption.quantity}
                  </div>
                  <div>
                    <strong>Valor Unitário:</strong>{" "}
                    {formatCurrency(selectedOption.unit_price)}
                  </div>
                  {selectedOption.delivery_days_impact > 0 && (
                    <div>
                      <strong>Impacto Prazo:</strong>{" "}
                      <Badge variant="secondary">
                        +{selectedOption.delivery_days_impact} dias
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold">Total de Opcionais</p>
              <p className="text-sm text-muted-foreground">
                {options.length} item(ns)
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl font-bold">{formatCurrency(totalPrice)}</p>
              {maxDeliveryDays > 0 && (
                <p className="text-sm text-muted-foreground">
                  +{maxDeliveryDays} dias no prazo
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
