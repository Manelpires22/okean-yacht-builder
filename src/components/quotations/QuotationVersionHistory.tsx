import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, FileText, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/quotation-utils";
import { useNavigate } from "react-router-dom";

interface QuotationVersionHistoryProps {
  quotationId: string;
  currentVersion: number;
}

export function QuotationVersionHistory({ 
  quotationId, 
  currentVersion 
}: QuotationVersionHistoryProps) {
  const navigate = useNavigate();

  // Buscar cotação pai (se esta for uma revisão)
  const { data: parentQuotation } = useQuery({
    queryKey: ['parent-quotation', quotationId],
    queryFn: async () => {
      const { data: current } = await supabase
        .from('quotations')
        .select('parent_quotation_id')
        .eq('id', quotationId)
        .single();

      if (!current?.parent_quotation_id) return null;

      const { data: parent } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', current.parent_quotation_id)
        .single();

      return parent;
    }
  });

  // Buscar todas as revisões desta cotação
  const { data: revisions } = useQuery({
    queryKey: ['quotation-revisions', quotationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('quotations')
        .select('*')
        .eq('parent_quotation_id', quotationId)
        .order('version', { ascending: false });

      return data || [];
    }
  });

  const hasHistory = parentQuotation || (revisions && revisions.length > 0);

  if (!hasHistory) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Histórico de Versões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cotação Pai */}
        {parentQuotation && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {parentQuotation.quotation_number}
                </span>
                <Badge variant="outline" className="text-xs">
                  v{parentQuotation.version}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/quotations/${parentQuotation.id}`)}
              >
                Ver original
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant="secondary">{parentQuotation.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Valor</p>
                <p className="font-medium">{formatCurrency(parentQuotation.final_price)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criada em</p>
                <p className="font-medium">
                  {format(new Date(parentQuotation.created_at), "dd/MM/yy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Versão Atual */}
        <div className="p-4 border-2 border-primary rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium">Versão Atual</span>
            <Badge variant="default">v{currentVersion}</Badge>
          </div>
        </div>

        {/* Revisões Criadas */}
        {revisions && revisions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Revisões Criadas ({revisions.length})
            </h4>
            {revisions.map((revision: any) => (
              <div key={revision.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {revision.quotation_number}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      v{revision.version}
                    </Badge>
                    <Badge 
                      variant={revision.status === 'sent' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {revision.status}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/quotations/${revision.id}`)}
                  >
                    Abrir
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium">{formatCurrency(revision.final_price)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Válida até</p>
                    <p className="font-medium">
                      {format(new Date(revision.valid_until), "dd/MM/yy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Criada em</p>
                    <p className="font-medium">
                      {format(new Date(revision.created_at), "dd/MM/yy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
