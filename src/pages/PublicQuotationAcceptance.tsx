import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, AlertCircle, ThumbsUp } from "lucide-react";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

export default function PublicQuotationAcceptance() {
  const { token } = useParams<{ token: string }>();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Buscar cotação pelo token
  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['public-quotation', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          yacht_models (*),
          quotation_options (
            *,
            options (*)
          ),
          quotation_customizations (*)
        `)
        .eq('secure_token', token)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!token
  });

  // Mutation para aceitar proposta
  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!quotation) throw new Error('Cotação não encontrada');

      const { error } = await supabase
        .from('quotations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by_name: customerName,
          accepted_by_email: customerEmail
        })
        .eq('id', quotation.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Proposta aceita com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao aceitar proposta: ' + error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Proposta Não Encontrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Esta proposta não existe ou o link pode estar expirado.
              Entre em contato com nosso time comercial.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(quotation.valid_until) < new Date();
  const isAlreadyAccepted = quotation.status === 'accepted';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">OKEAN Yachts</h1>
          <p className="text-muted-foreground">Proposta de Aquisição</p>
        </div>

        {/* Status da Proposta */}
        {isAlreadyAccepted && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Proposta já aceita!</strong> Esta proposta foi aceita em{" "}
              {format(new Date(quotation.accepted_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.
            </AlertDescription>
          </Alert>
        )}

        {isExpired && !isAlreadyAccepted && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Proposta expirada.</strong> Esta proposta expirou em{" "}
              {format(new Date(quotation.valid_until), "dd/MM/yyyy", { locale: ptBR })}.
              Entre em contato para renovar.
            </AlertDescription>
          </Alert>
        )}

        {/* Informações da Proposta */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Proposta {quotation.quotation_number}</CardTitle>
              <Badge variant={isExpired ? "destructive" : "default"}>
                {isExpired ? "Expirada" : `Válida até ${format(new Date(quotation.valid_until), "dd/MM/yyyy", { locale: ptBR })}`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{quotation.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium">
                  {format(new Date(quotation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modelo do Iate */}
        <Card>
          <CardHeader>
            <CardTitle>Modelo Selecionado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {quotation.yacht_models?.image_url && (
                <img
                  src={quotation.yacht_models.image_url}
                  alt={quotation.yacht_models.name}
                  className="w-48 h-48 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{quotation.yacht_models?.name}</h3>
                <p className="text-muted-foreground mb-4">{quotation.yacht_models?.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Preço Base</p>
                    <p className="text-lg font-bold">{formatCurrency(quotation.final_base_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prazo de Entrega</p>
                    <p className="text-lg font-bold">{formatDays(quotation.total_delivery_days)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opcionais */}
        {quotation.quotation_options && quotation.quotation_options.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Opcionais Incluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quotation.quotation_options.map((opt: any) => (
                  <div key={opt.id} className="flex justify-between items-center pb-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{opt.options?.name}</p>
                      <p className="text-sm text-muted-foreground">Qtd: {opt.quantity}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(opt.total_price)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo Financeiro */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-xl">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Preço Base</span>
              <span className="font-medium">{formatCurrency(quotation.final_base_price)}</span>
            </div>
            {quotation.final_options_price > 0 && (
              <div className="flex justify-between">
                <span>Opcionais</span>
                <span className="font-medium">{formatCurrency(quotation.final_options_price)}</span>
              </div>
            )}
            {quotation.total_customizations_price > 0 && (
              <div className="flex justify-between">
                <span>Customizações</span>
                <span className="font-medium">{formatCurrency(quotation.total_customizations_price)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-2xl font-bold text-primary">
              <span>Valor Total</span>
              <span>{formatCurrency(quotation.final_price)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Aceite */}
        {!isExpired && !isAlreadyAccepted && (
          <Card className="border-2 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-600" />
                Aceitar Esta Proposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu Nome Completo *</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="João da Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Seu Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="joao@empresa.com.br"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="cursor-pointer text-sm">
                  Li e aceito os termos desta proposta, incluindo valores, prazos e condições apresentadas
                </Label>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => acceptMutation.mutate()}
                disabled={!acceptedTerms || !customerName || !customerEmail || acceptMutation.isPending}
              >
                {acceptMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Aceitar Proposta Agora
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Ao aceitar, você confirma o interesse na aquisição deste iate conforme especificações acima.
                Nossa equipe entrará em contato para prosseguir com o processo.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
