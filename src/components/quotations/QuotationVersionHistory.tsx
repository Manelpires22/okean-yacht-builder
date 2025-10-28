import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, FileText, ChevronDown, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/quotation-utils";
import { useNavigate } from "react-router-dom";
import { useQuotationVersionChain } from "@/hooks/useQuotationVersionChain";
import { Skeleton } from "@/components/ui/skeleton";
import { QuotationStatusBadge } from "./QuotationStatusBadge";

type QuotationStatus = "draft" | "pending_approval" | "approved" | "rejected" | "sent" | "accepted" | "cancelled";

interface QuotationVersionHistoryProps {
  quotationId: string;
}

export function QuotationVersionHistory({ quotationId }: QuotationVersionHistoryProps) {
  const navigate = useNavigate();
  const { data: versionChain, isLoading } = useQuotationVersionChain(quotationId);
  
  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }
  
  if (!versionChain) return null;
  
  const { currentQuotation, allVersions, isLatest, latestVersion } = versionChain;
  const previousVersions = allVersions.filter(v => v.id !== currentQuotation.id);
  
  return (
    <div className="space-y-4">
      {/* ⚠️ Alerta se não for a versão mais recente */}
      {!isLatest && latestVersion && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Versão Desatualizada</AlertTitle>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>
              Você está visualizando a <strong>v{currentQuotation.version}</strong>. 
              Existe uma versão mais recente: <strong>v{latestVersion.version}</strong> ({latestVersion.quotation_number}).
            </span>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => navigate(`/quotations/${latestVersion.id}`)}
            >
              Ver Última Versão →
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* ⭐ Card da Versão Atual */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm">
                VERSÃO ATUAL - v{currentQuotation.version}
              </Badge>
              <span className="font-mono text-sm font-medium">
                {currentQuotation.quotation_number}
              </span>
            </div>
            <QuotationStatusBadge status={currentQuotation.status as any} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Cliente</p>
              <p className="font-medium">{currentQuotation.client_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Valor Total</p>
              <p className="font-medium text-lg">{formatCurrency(currentQuotation.final_price)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Criada em</p>
              <p className="font-medium">
                {format(new Date(currentQuotation.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Validade</p>
              <p className="font-medium">
                {format(new Date(currentQuotation.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 📜 Histórico de Versões Anteriores */}
      {previousVersions.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                📜 Histórico de Versões ({previousVersions.length} {previousVersions.length === 1 ? 'versão anterior' : 'versões anteriores'})
              </span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {previousVersions.map((version: any) => (
              <Card key={version.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline">v{version.version}</Badge>
                        <span className="font-mono text-sm">{version.quotation_number}</span>
                        <QuotationStatusBadge status={version.status as any} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">💰</span> {formatCurrency(version.final_price)}
                        </div>
                        <div>
                          <span className="font-medium">📅</span> {format(new Date(version.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div>
                          <span className="font-medium">⏳</span> Válida até {format(new Date(version.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => navigate(`/quotations/${version.id}`)}
                      className="shrink-0"
                    >
                      Abrir <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
