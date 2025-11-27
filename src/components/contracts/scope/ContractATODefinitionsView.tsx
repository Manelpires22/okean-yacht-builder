import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, TrendingUp, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ApprovedATO {
  id: string;
  ato_number: string;
  title: string;
  description: string | null;
  price_impact: number | null;
  discount_percentage: number | null;
  delivery_days_impact: number | null;
  approved_at: string | null;
}

interface ContractATODefinitionsViewProps {
  approvedATOs: ApprovedATO[];
}

export function ContractATODefinitionsView({
  approvedATOs,
}: ContractATODefinitionsViewProps) {
  if (approvedATOs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum ATO aprovado
        </CardContent>
      </Card>
    );
  }

  // Calcular totais
  const totalATOsPrice = approvedATOs.reduce((sum, ato) => {
    const priceImpact = ato.price_impact || 0;
    const discount = ato.discount_percentage || 0;
    const finalPrice = priceImpact * (1 - discount / 100);
    return sum + finalPrice;
  }, 0);

  const totalDeliveryDays = approvedATOs.reduce(
    (sum, ato) => sum + (ato.delivery_days_impact || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">ATOs Aprovados</h3>
        <div className="flex gap-2">
          <Badge variant="outline">{approvedATOs.length} aditivo(s)</Badge>
          <Badge variant="default">{formatCurrency(totalATOsPrice)}</Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {approvedATOs.map((ato) => {
          const priceImpact = ato.price_impact || 0;
          const discount = ato.discount_percentage || 0;
          const finalPrice = priceImpact * (1 - discount / 100);

          return (
            <Card key={ato.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {ato.ato_number} - {ato.title}
                    </CardTitle>
                    {ato.description && (
                      <p className="text-sm text-muted-foreground">
                        {ato.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="default" className="text-base px-4 py-1 ml-4">
                    {formatCurrency(finalPrice)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {discount > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Percent className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                          Desconto Aplicado
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                        {discount.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor original: {formatCurrency(priceImpact)}
                      </p>
                    </div>
                  )}

                  {ato.approved_at && (
                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                          Aprovado em
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                        {format(new Date(ato.approved_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  )}

                  {ato.delivery_days_impact && ato.delivery_days_impact > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Impacto no Prazo
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                        +{ato.delivery_days_impact} dias
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold">Total de ATOs Aprovados</p>
              <p className="text-sm text-muted-foreground">
                {approvedATOs.length} aditivo(s)
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl font-bold">
                {formatCurrency(totalATOsPrice)}
              </p>
              {totalDeliveryDays > 0 && (
                <p className="text-sm text-muted-foreground">
                  +{totalDeliveryDays} dias no prazo
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
