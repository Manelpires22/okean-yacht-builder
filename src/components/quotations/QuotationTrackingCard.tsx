import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, Monitor } from "lucide-react";
import { useQuotationViews } from "@/hooks/useQuotationViews";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuotationTrackingCardProps {
  quotationId: string;
}

export function QuotationTrackingCard({ quotationId }: QuotationTrackingCardProps) {
  const { data: tracking } = useQuotationViews(quotationId);

  if (!tracking || tracking.totalViews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Rastreamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Proposta ainda não foi visualizada pelo cliente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Rastreamento de Visualizações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tracking.totalViews}</p>
              <p className="text-sm text-muted-foreground">
                Visualizaç{tracking.totalViews === 1 ? 'ão' : 'ões'}
              </p>
            </div>
          </div>

          {tracking.lastViewed && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(tracking.lastViewed), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  às {format(new Date(tracking.lastViewed), "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Histórico de visualizações */}
        {tracking.views.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-3">Histórico de Acessos</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tracking.views.slice(0, 10).map((view: any) => (
                <div key={view.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(new Date(view.viewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {view.time_on_page_seconds && (
                    <Badge variant="outline" className="text-xs">
                      {Math.floor(view.time_on_page_seconds / 60)}min {view.time_on_page_seconds % 60}s
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tracking.totalViews > 3 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-900 dark:text-green-100">
              ✓ Cliente demonstrou forte interesse ({tracking.totalViews} visualizações)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
