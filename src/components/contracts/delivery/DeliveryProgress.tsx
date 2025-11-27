import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Package } from "lucide-react";
import { DeliveryProgress as ProgressData } from "@/hooks/useContractDeliveryChecklist";

interface DeliveryProgressProps {
  progress: ProgressData;
}

export function DeliveryProgress({ progress }: DeliveryProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Progresso de Verificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {progress.percentage}%
            </p>
            <p className="text-sm text-muted-foreground">
              {progress.verified} de {progress.total} itens verificados
            </p>
          </div>
          {progress.percentage === 100 && (
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          )}
        </div>
        
        <Progress value={progress.percentage} className="h-3" />
        
        {progress.percentage === 100 && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              ✅ Todos os itens foram verificados! O barco está pronto para entrega.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
