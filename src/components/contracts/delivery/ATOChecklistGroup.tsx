import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DeliveryChecklistItemComponent } from "./DeliveryChecklistItem";
import { DeliveryChecklistItem } from "@/hooks/useContractDeliveryChecklist";
import { FileText } from "lucide-react";

interface ATOChecklistGroupProps {
  atoNumber: string;
  configItems: DeliveryChecklistItem[];
}

export function ATOChecklistGroup({ atoNumber, configItems }: ATOChecklistGroupProps) {
  const verifiedCount = configItems.filter(item => item.is_verified).length;
  const totalCount = configItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{atoNumber}</CardTitle>
          </div>
          <Badge variant={verifiedCount === totalCount && totalCount > 0 ? "default" : "secondary"}>
            {verifiedCount}/{totalCount} itens
          </Badge>
        </div>
        
        {totalCount > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso de verificação</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {configItems.length > 0 ? (
          configItems.map(config => (
            <DeliveryChecklistItemComponent
              key={config.id}
              item={config}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum item configurado nesta ATO
          </p>
        )}
      </CardContent>
    </Card>
  );
}
