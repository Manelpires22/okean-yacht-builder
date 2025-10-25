import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle2, XCircle, FileText, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { useSyncCustomizations } from "@/hooks/useSyncCustomizations";

interface Customization {
  id: string;
  item_name: string;
  notes?: string;
  quantity?: number;
  status: 'pending' | 'approved' | 'rejected';
  additional_cost?: number;
  delivery_impact_days?: number;
  engineering_notes?: string;
  file_paths?: string[];
}

interface CustomizationStatusCardProps {
  customizations: Customization[];
  quotationId: string;
}

export function CustomizationStatusCard({ customizations, quotationId }: CustomizationStatusCardProps) {
  const syncMutation = useSyncCustomizations();
  
  if (!customizations || customizations.length === 0) {
    return null;
  }

  const pendingCount = customizations.filter(c => c.status === 'pending').length;
  const approvedCount = customizations.filter(c => c.status === 'approved').length;
  const rejectedCount = customizations.filter(c => c.status === 'rejected').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Validada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com badges e sincronização */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {pendingCount} Pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
          {approvedCount > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              {approvedCount} Validada{approvedCount > 1 ? 's' : ''}
            </Badge>
          )}
          {rejectedCount > 0 && (
            <Badge variant="outline" className="text-destructive border-destructive">
              {rejectedCount} Rejeitada{rejectedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {pendingCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncMutation.mutate(quotationId)}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        )}
      </div>

      {/* Lista de customizações */}
      <div className="space-y-4">
        {customizations.map((custom) => (
          <div 
            key={custom.id} 
            className={`border-l-4 pl-4 ${
              custom.status === 'approved' 
                ? 'border-green-600' 
                : custom.status === 'rejected'
                ? 'border-destructive'
                : 'border-yellow-600'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {getStatusIcon(custom.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{custom.item_name}</p>
                  {custom.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {custom.notes}
                    </p>
                  )}
                  {custom.quantity && (
                    <p className="text-sm mt-1">
                      Quantidade: {custom.quantity}
                    </p>
                  )}
                  {custom.file_paths && custom.file_paths.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{custom.file_paths.length} arquivo{custom.file_paths.length > 1 ? 's' : ''} anexado{custom.file_paths.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(custom.status)}
            </div>

            {/* Resposta da Engenharia */}
            {custom.status !== 'pending' && (
              <Alert className={`mt-3 ${
                custom.status === 'approved' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <AlertDescription>
                  <p className="font-medium text-sm">
                    {custom.status === 'approved' ? '✓ Validação Técnica' : '✗ Reprovado pela Engenharia'}
                  </p>
                  
                  {custom.engineering_notes && (
                    <p className="mt-2 text-sm">{custom.engineering_notes}</p>
                  )}
                  
                  {custom.status === 'approved' && (
                    <div className="mt-2 space-y-1">
                      {custom.additional_cost && custom.additional_cost > 0 && (
                        <p className="text-sm font-medium">
                          Custo adicional: {formatCurrency(custom.additional_cost)}
                        </p>
                      )}
                      {custom.delivery_impact_days && custom.delivery_impact_days > 0 && (
                        <p className="text-sm">
                          Impacto no prazo: +{custom.delivery_impact_days} {custom.delivery_impact_days === 1 ? 'dia' : 'dias'}
                        </p>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
