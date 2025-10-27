import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useQuotation } from "@/hooks/useQuotations";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Mail, Edit, Send, Copy, ExternalLink, Link as LinkIcon } from "lucide-react";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QuotationStatusBadge } from "@/components/quotations/QuotationStatusBadge";
import { QuotationStatusChecklist } from "@/components/quotations/QuotationStatusChecklist";
import { RevalidationAlert } from "@/components/quotations/RevalidationAlert";
import { SendQuotationDialog, type SendQuotationData } from "@/components/quotations/SendQuotationDialog";
import { QuotationTrackingCard } from "@/components/quotations/QuotationTrackingCard";
import { NextStepsCard } from "@/components/quotations/NextStepsCard";
import { QuotationHeroSection } from "@/components/quotations/QuotationHeroSection";
import { QuotationDetailsAccordion } from "@/components/quotations/QuotationDetailsAccordion";
import { CustomizationWorkflowCard } from "@/components/quotations/CustomizationWorkflowCard";
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

  // Buscar status das aprovações
  const { data: approvals } = useQuery({
    queryKey: ['quotation-approvals', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approvals')
        .select('approval_type, status')
        .eq('quotation_id', id!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Calcular status de aprovações
  const commercialApprovals = approvals?.filter(a => a.approval_type === 'commercial') || [];
  const technicalApprovals = approvals?.filter(a => a.approval_type === 'technical') || [];
  
  const commercialApprovalStatus = commercialApprovals.length === 0 
    ? undefined 
    : commercialApprovals.every(a => a.status === 'approved') 
      ? 'approved' 
      : commercialApprovals.some(a => a.status === 'rejected')
        ? 'rejected'
        : 'pending';

  const technicalApprovalStatus = technicalApprovals.length === 0
    ? undefined
    : technicalApprovals.every(a => a.status === 'approved')
      ? 'approved'
      : technicalApprovals.some(a => a.status === 'rejected')
        ? 'rejected'
        : 'pending';

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    // TODO: Implementar lógica de revalidação
    setTimeout(() => setIsRevalidating(false), 2000);
  };

  const handleEdit = async () => {
    if (!quotation) return;
    
    try {
      const newQuotation = await createRevision.mutateAsync(quotation.id);
      toast.success(`Revisão ${newQuotation.quotation_number} criada! Redirecionando para edição...`);
      // Navegar para o configurador com a nova cotação
      setTimeout(() => navigate(`/configurator?edit=${newQuotation.id}`), 1000);
    } catch (error) {
      // Erro já tratado no hook
    }
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

  const handleCopyPublicLink = () => {
    if (!quotation) return;
    
    const publicUrl = `${window.location.origin}/quotation/${quotation.id}/${quotation.secure_token}`;
    
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast.success("Link copiado!", {
        description: "O link público da cotação foi copiado para a área de transferência.",
      });
    }).catch(() => {
      toast.error("Erro ao copiar link");
    });
  };

  const handleOpenPublicView = () => {
    if (!quotation) return;
    
    const publicUrl = `/quotation/${quotation.id}/${quotation.secure_token}`;
    window.open(publicUrl, '_blank');
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

  // Calcular economia total
  const totalDiscount = 
    (quotation.base_price * (quotation.base_discount_percentage / 100)) +
    ((quotation.total_options_price || 0) * (quotation.options_discount_percentage / 100));

  // Determinar seções expandidas por padrão
  const defaultExpandedSections = [
    'general-info', // Sempre expandido
    ...(quotation.quotation_customizations?.some((c: any) => c.status === 'pending') ? ['customizations'] : []),
    ...(revalidation?.needsRevalidation ? ['financial'] : [])
  ];

  return (
    <>
      <AppHeader title={`Cotação ${quotation.quotation_number}`} />
      <div className="container mx-auto p-6 space-y-6 pb-24">
        {/* Header com navegação e status */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex-1" />
          
          {/* Botões de Link Público */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPublicLink}
            className="gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            Copiar Link Público
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPublicView}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Ver Versão Pública
          </Button>
          
          <QuotationStatusBadge status={quotation.status as any} />
        </div>

        {/* Hero Section - Modelo + Resumo Financeiro */}
        <QuotationHeroSection
          yachtModel={{
            name: quotation.yacht_models?.name || 'N/A',
            code: quotation.yacht_models?.code || 'N/A',
            description: quotation.yacht_models?.description,
            image_url: quotation.yacht_models?.image_url,
          }}
          basePrice={quotation.base_price}
          finalPrice={quotation.final_price}
          baseDeliveryDays={quotation.base_delivery_days}
          totalDeliveryDays={quotation.total_delivery_days}
          discountAmount={totalDiscount}
        />

        {/* Alerta de Revalidação (se necessário) */}
        {revalidation?.needsRevalidation && quotation.status === 'draft' && (
          <RevalidationAlert
            issues={revalidation.issues}
            onRevalidate={handleRevalidate}
            isRevalidating={isRevalidating}
          />
        )}

        {/* Checklist de Status */}
        {quotation.status === 'draft' && (
          <QuotationStatusChecklist
            status={quotation.status}
            baseDiscountPercentage={quotation.base_discount_percentage || 0}
            optionsDiscountPercentage={quotation.options_discount_percentage || 0}
            hasCustomizations={!!quotation.quotation_customizations?.length}
            customizationsApproved={quotation.quotation_customizations?.every((c: any) => c.status === 'approved') || false}
            validUntil={quotation.valid_until}
            commercialApprovalStatus={commercialApprovalStatus}
            technicalApprovalStatus={technicalApprovalStatus}
          />
        )}

        {/* Tracking e Versões (se enviada) */}
        {(quotation.status === 'sent' || quotation.status === 'accepted') && (
          <QuotationTrackingCard quotationId={quotation.id} />
        )}

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

        {/* Workflow de Customizações */}
        {quotation.quotation_customizations && quotation.quotation_customizations.length > 0 && (
          <CustomizationWorkflowCard quotationId={quotation.id} />
        )}

        {/* Detalhes em Accordion */}
        <QuotationDetailsAccordion 
          quotation={quotation}
          defaultExpanded={defaultExpandedSections}
        />
      </div>

      {/* Botões de Ação - Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-10">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-3 justify-end">
            {/* Botão Editar - só se draft */}
            {quotationStatus.canEdit && (
              <Button 
                variant="outline" 
                onClick={handleEdit} 
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Proposta
              </Button>
            )}

            {/* Botões de Envio - ready_to_send ou sent */}
            {(quotation.status === 'ready_to_send' || quotation.status === 'sent') && (
              <Button 
                onClick={handleSendToClient} 
                size="lg"
                className="flex-1 sm:flex-none"
              >
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
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <Copy className="mr-2 h-4 w-4" />
                {createRevision.isPending ? 'Criando...' : 'Criar Revisão'}
              </Button>
            )}

            {/* Botão Solicitar Aprovação - se draft e precisa aprovação */}
            {quotation.status === 'draft' && (quotationStatus.needsCommercialApproval || quotationStatus.needsTechnicalApproval) && (
              <Button 
                onClick={() => console.log("Solicitar aprovação")} 
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <Mail className="mr-2 h-4 w-4" />
                Solicitar Aprovação
              </Button>
            )}
          </div>
        </div>
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
    </>
  );
}
