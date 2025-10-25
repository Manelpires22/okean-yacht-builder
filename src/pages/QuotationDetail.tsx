import { useParams, useNavigate } from "react-router-dom";
import { useQuotation } from "@/hooks/useQuotations";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Mail, Edit, Send, Copy } from "lucide-react";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QuotationStatusBadge } from "@/components/quotations/QuotationStatusBadge";
import { QuotationStatusChecklist } from "@/components/quotations/QuotationStatusChecklist";
import { CustomizationStatusCard } from "@/components/quotations/CustomizationStatusCard";
import { RevalidationAlert } from "@/components/quotations/RevalidationAlert";
import { SendQuotationDialog, type SendQuotationData } from "@/components/quotations/SendQuotationDialog";
import { QuotationTrackingCard } from "@/components/quotations/QuotationTrackingCard";
import { QuotationVersionHistory } from "@/components/quotations/QuotationVersionHistory";
import { NextStepsCard } from "@/components/quotations/NextStepsCard";
import { useQuotationStatus } from "@/hooks/useQuotationStatus";
import { useQuotationRevalidation } from "@/hooks/useQuotationRevalidation";
import { useSendQuotation } from "@/hooks/useSendQuotation";
import { useCreateRevision } from "@/hooks/useCreateRevision";
import { useState } from "react";
import { toast } from "sonner";

export default function QuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: quotation, isLoading } = useQuotation(id!);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendMode, setSendMode] = useState<'client' | 'seller' | 'download'>('client');

  // Hooks para status e revalidação
  const quotationStatus = useQuotationStatus(quotation || null);
  const { data: revalidation } = useQuotationRevalidation(id);
  const sendQuotation = useSendQuotation();
  const createRevision = useCreateRevision();

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    // TODO: Implementar lógica de revalidação
    setTimeout(() => setIsRevalidating(false), 2000);
  };

  const handleEdit = () => {
    navigate(`/configurator?quotation=${id}`);
  };

  const handleSendToClient = () => {
    setSendMode('client');
    setSendDialogOpen(true);
  };

  const handleSendToSelf = () => {
    setSendMode('seller');
    setSendDialogOpen(true);
  };

  const handleDownloadPDF = async () => {
    toast.info("Em desenvolvimento", {
      description: "A funcionalidade de download de PDF será implementada em breve.",
    });
  };

  const handleCreateRevision = async () => {
    if (!quotation) return;
    
    try {
      const newQuotation = await createRevision.mutateAsync(quotation.id);
      toast.success(`Revisão criada! Redirecionando...`);
      setTimeout(() => navigate(`/quotations/${newQuotation.id}`), 1500);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleSend = async (data: SendQuotationData) => {
    if (!quotation) return;
    
    await sendQuotation.mutateAsync({
      quotationId: quotation.id,
      sendEmail: data.sendEmail,
      generatePDF: data.generatePDF,
      recipientEmail: data.recipientEmail,
      emailSubject: data.emailSubject,
      emailMessage: data.emailMessage
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando cotação...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="container mx-auto p-6">
        <p>Cotação não encontrada</p>
      </div>
    );
  }

  return (
    <>
      <AppHeader title={`Cotação ${quotation.quotation_number}`} />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header com navegação e status */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Cotações
          </Button>
          <div className="flex-1" />
          <QuotationStatusBadge status={quotation.status as any} />
        </div>

        {/* Alerta de Revalidação (se necessário) */}
        {revalidation?.needsRevalidation && quotation.status === 'draft' && (
          <RevalidationAlert
            issues={revalidation.issues}
            onRevalidate={handleRevalidate}
            isRevalidating={isRevalidating}
          />
        )}

        {/* Checklist de Status */}
        <QuotationStatusChecklist
          status={quotation.status}
          baseDiscountPercentage={quotation.base_discount_percentage || 0}
          optionsDiscountPercentage={quotation.options_discount_percentage || 0}
          hasCustomizations={!!quotation.quotation_customizations?.length}
          customizationsApproved={quotation.quotation_customizations?.every((c: any) => c.status === 'approved') || false}
          validUntil={quotation.valid_until}
        />

        {/* Tracking e Versões (se enviada) */}
        {(quotation.status === 'sent' || quotation.status === 'accepted') && (
          <QuotationTrackingCard quotationId={quotation.id} />
        )}

        <QuotationVersionHistory 
          quotationId={quotation.id} 
          currentVersion={quotation.version || 1}
        />

        {/* Next Steps Card - Only show for draft status */}
        {quotation.status === 'draft' && (
          <NextStepsCard
            quotation={quotation}
            onSendToClient={handleSendToClient}
            onSendToSelf={handleSendToSelf}
            onDownloadPDF={handleDownloadPDF}
            needsApproval={quotationStatus.needsCommercialApproval || quotationStatus.needsTechnicalApproval}
          />
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">
                {quotation.clients?.name || quotation.client_name}
              </p>
            </div>
            {quotation.clients?.company && (
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{quotation.clients.company}</p>
              </div>
            )}
            {(quotation.clients?.email || quotation.client_email) && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">
                  {quotation.clients?.email || quotation.client_email}
                </p>
              </div>
            )}
            {(quotation.clients?.phone || quotation.client_phone) && (
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">
                  {quotation.clients?.phone || quotation.client_phone}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Cotação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Vendedor</p>
              <p className="font-medium">{quotation.users?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Criada em</p>
              <p className="font-medium">
                {format(new Date(quotation.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Válida até</p>
              <p className="font-medium">
                {format(new Date(quotation.valid_until), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelo do Iate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {quotation.yacht_models?.image_url && (
              <img
                src={quotation.yacht_models.image_url}
                alt={quotation.yacht_models.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold">{quotation.yacht_models?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Código: {quotation.yacht_models?.code}
              </p>
              <p className="mt-2">{quotation.yacht_models?.description}</p>
              <div className="mt-4 flex gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preço Base</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(quotation.base_price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prazo Base</p>
                  <p className="text-lg font-bold">
                    {formatDays(quotation.base_delivery_days)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customizações (se houver) */}
      {quotation.quotation_customizations && quotation.quotation_customizations.length > 0 && (
        <CustomizationStatusCard
          customizations={quotation.quotation_customizations.map((c: any) => ({
            id: c.id,
            item_name: c.item_name,
            notes: c.notes,
            quantity: c.quantity,
            status: c.status || 'pending',
            additional_cost: c.additional_cost,
            delivery_impact_days: c.delivery_impact_days,
            engineering_notes: c.engineering_notes,
            file_paths: c.file_paths
          }))}
        />
      )}

      {quotation.quotation_options && quotation.quotation_options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opcionais Selecionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotation.quotation_options.map((opt: any) => (
                <div
                  key={opt.id}
                  className="flex justify-between items-start border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{opt.options?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Código: {opt.options?.code}
                    </p>
                    <p className="text-sm mt-1">{opt.options?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Quantidade: {opt.quantity}
                    </p>
                    <p className="font-medium">
                      {formatCurrency(opt.total_price)}
                    </p>
                    {opt.delivery_days_impact > 0 && (
                      <p className="text-sm text-muted-foreground">
                        +{opt.delivery_days_impact} dias
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Preço Base do Modelo</span>
            <span className="font-medium">
              {formatCurrency(quotation.base_price)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total de Opcionais</span>
            <span className="font-medium">
              {formatCurrency(quotation.total_options_price)}
            </span>
          </div>
          {quotation.discount_amount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Desconto</span>
              <span className="font-medium">
                -{formatCurrency(quotation.discount_amount)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Valor Total</span>
            <span>{formatCurrency(quotation.final_price)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Prazo Total de Entrega</span>
            <span>{formatDays(quotation.total_delivery_days)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação Contextuais */}
      <div className="flex gap-4 justify-end">
        {/* Botão Editar - só se draft */}
        {quotationStatus.canEdit && (
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Proposta
          </Button>
        )}

        {/* Botões de Envio - ready_to_send ou sent */}
        {(quotation.status === 'ready_to_send' || quotation.status === 'sent') && (
          <Button onClick={handleSendToClient}>
            <Send className="mr-2 h-4 w-4" />
            {quotation.status === 'sent' ? 'Reenviar Proposta' : 'Enviar Proposta'}
          </Button>
        )}

        {/* Botão Criar Revisão - se enviada ou expirada */}
        {(quotation.status === 'sent' || quotation.status === 'expired') && (
          <Button 
            variant="outline" 
            onClick={handleCreateRevision}
            disabled={createRevision.isPending}
          >
            <Copy className="mr-2 h-4 w-4" />
            {createRevision.isPending ? 'Criando...' : 'Criar Revisão'}
          </Button>
        )}

        {/* Botão Solicitar Aprovação - se draft e precisa aprovação */}
        {quotation.status === 'draft' && (quotationStatus.needsCommercialApproval || quotationStatus.needsTechnicalApproval) && (
          <Button onClick={() => console.log("Solicitar aprovação")}>
            <Send className="mr-2 h-4 w-4" />
            Solicitar Aprovação
          </Button>
        )}
      </div>

      {/* Dialog de Envio */}
      {quotation && (
        <SendQuotationDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          quotationNumber={quotation.quotation_number}
          clientName={quotation.clients?.name || quotation.client_name}
          clientEmail={quotation.clients?.email || quotation.client_email}
          onSend={handleSend}
          mode={sendMode}
          sellerEmail={user?.email || ''}
        />
      )}
      </div>
    </>
  );
}
