import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Send, 
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";

export function QuotationsDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['quotations-dashboard-stats'],
    queryFn: async () => {
      const { data: quotations } = await supabase
        .from('quotations')
        .select('status, final_price, created_at, valid_until');

      if (!quotations) return null;

      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const total = quotations.length;
      const pendingApproval = quotations.filter(q => 
        q.status === 'pending_commercial_approval' || 
        q.status === 'pending_technical_approval'
      ).length;
      
      const readyToSend = quotations.filter(q => q.status === 'ready_to_send').length;
      const sent = quotations.filter(q => q.status === 'sent').length;
      const accepted = quotations.filter(q => q.status === 'accepted').length;
      
      const expiringSoon = quotations.filter(q => {
        if (q.status !== 'sent') return false;
        const validUntil = new Date(q.valid_until);
        const daysRemaining = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysRemaining <= 7 && daysRemaining >= 0;
      }).length;

      const totalValue = quotations
        .filter(q => q.status !== 'rejected' && q.status !== 'expired')
        .reduce((sum, q) => sum + q.final_price, 0);

      const acceptedValue = quotations
        .filter(q => q.status === 'accepted')
        .reduce((sum, q) => sum + q.final_price, 0);

      const conversionRate = sent > 0 ? (accepted / sent) * 100 : 0;

      const recentQuotations = quotations.filter(q => 
        new Date(q.created_at) >= thirtyDaysAgo
      ).length;

      return {
        total,
        pendingApproval,
        readyToSend,
        sent,
        accepted,
        expiringSoon,
        totalValue,
        acceptedValue,
        conversionRate,
        recentQuotations
      };
    }
  });

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Aguardando Aprovação
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Propostas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Prontas para Envio
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.readyToSend}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Validadas e aprovadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-600" />
                Enviadas ao Cliente
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Expirando em Breve
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Válidas por ≤7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taxa de Conversão
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.accepted} aceitas de {stats.sent} enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Valor Total em Negociação
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total} propostas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Valor Aceito
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.acceptedValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.accepted} propostas aceitas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Atividade dos Últimos 30 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.recentQuotations}</p>
              <p className="text-sm text-muted-foreground">
                Propostas criadas no último mês
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
