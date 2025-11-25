import { useContractTimeline } from "@/hooks/useContractTimeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Edit, 
  TrendingUp,
  Clock,
  User,
  Wrench,
  ShoppingCart,
  Calendar,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContractTimelineProps {
  contractId: string;
  onATOClick?: (atoId: string) => void;
}

const EVENT_ICONS = {
  contract_created: FileText,
  ato_created: Plus,
  ato_approved: CheckCircle2,
  ato_rejected: XCircle,
  ato_cancelled: Ban,
  contract_updated: Edit,
  status_changed: TrendingUp,
  ato_workflow_pm_review: Wrench,
  ato_workflow_supply_quote: ShoppingCart,
  ato_workflow_planning: Calendar,
  ato_workflow_client_approval: UserCheck,
};

const EVENT_COLORS = {
  contract_created: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
  ato_created: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20",
  ato_approved: "text-green-600 bg-green-100 dark:bg-green-900/20",
  ato_rejected: "text-red-600 bg-red-100 dark:bg-red-900/20",
  ato_cancelled: "text-gray-600 bg-gray-100 dark:bg-gray-900/20",
  contract_updated: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
  status_changed: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20",
  ato_workflow_pm_review: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20",
  ato_workflow_supply_quote: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
  ato_workflow_planning: "text-teal-600 bg-teal-100 dark:bg-teal-900/20",
  ato_workflow_client_approval: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20",
};

export function ContractTimeline({ contractId, onATOClick }: ContractTimelineProps) {
  const { data: timeline, isLoading } = useContractTimeline(contractId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Linha do Tempo
          </CardTitle>
          <CardDescription>Histórico completo de eventos do contrato</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum evento registrado</h3>
            <p className="text-muted-foreground">
              O histórico de eventos aparecerá aqui conforme o contrato for modificado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Linha do Tempo
        </CardTitle>
        <CardDescription>
          Histórico completo de eventos e modificações - {timeline.length} evento(s) registrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {timeline.map((event, index) => {
                const Icon = EVENT_ICONS[event.event_type] || FileText;
                const colorClass = EVENT_COLORS[event.event_type] || EVENT_COLORS.contract_updated;
                const isATOEvent = event.event_type.startsWith('ato_');
                const atoId = event.metadata?.atoId;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div 
                        className={`bg-card border rounded-lg p-4 transition-all ${
                          isATOEvent && atoId && onATOClick 
                            ? 'cursor-pointer hover:shadow-md hover:border-primary' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => {
                          if (isATOEvent && atoId && onATOClick) {
                            onATOClick(atoId);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(event.timestamp), "dd/MM/yyyy", { locale: ptBR })}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">
                          {event.description}
                        </p>
                        
                        {/* Status do workflow para ATOs criadas */}
                        {event.workflowStatus && (
                          <div className="mb-3 p-2 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3 text-yellow-600" />
                              <span className="font-medium">Status: {event.workflowStatus.status}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.timestamp), "HH:mm", { locale: ptBR })}
                          </div>

                          {event.user_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {event.user_name}
                            </div>
                          )}
                        </div>

                        {/* Metadata adicional para alguns eventos */}
                        {event.event_type === "ato_approved" && event.metadata && (
                          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Impacto Preço:</span>
                              <span className="ml-1 font-semibold text-green-600">
                                +R$ {event.metadata.price_impact?.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Impacto Prazo:</span>
                              <span className="ml-1 font-semibold text-orange-600">
                                +{event.metadata.delivery_days_impact} dias
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Metadata para workflow steps */}
                        {event.metadata?.response_data && (
                          <div className="mt-3 pt-3 border-t text-xs space-y-1">
                            {event.metadata.response_data.estimated_cost && (
                              <div>
                                <span className="text-muted-foreground">Custo Estimado:</span>
                                <span className="ml-1 font-semibold">
                                  R$ {event.metadata.response_data.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}
                            {event.metadata.response_data.delivery_impact_days !== undefined && (
                              <div>
                                <span className="text-muted-foreground">Impacto Prazo:</span>
                                <span className="ml-1 font-semibold">
                                  +{event.metadata.response_data.delivery_impact_days} dias
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
