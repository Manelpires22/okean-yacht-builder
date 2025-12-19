import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useQuotation } from "@/hooks/useQuotations";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Mail, Edit, Send, Copy, ExternalLink, Link as LinkIcon, CheckCircle2, FileCheck } from "lucide-react";
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
import { QuotationVersionHistory } from "@/components/quotations/QuotationVersionHistory";
import { CustomizationWorkflowCard } from "@/components/quotations/CustomizationWorkflowCard";
import { useQuotationStatus } from "@/hooks/useQuotationStatus";
import { useQuotationApprovalStatus } from "@/hooks/useQuotationApprovalStatus";
import { useQuotationRevalidation } from "@/hooks/useQuotationRevalidation";
import { useSendQuotation } from "@/hooks/useSendQuotation";
import { useCreateRevision } from "@/hooks/useCreateRevision";
import { useApproveQuotation } from "@/hooks/useApproveQuotation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { data: quotation, isLoading } = useQuotation(id!);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendMode, setSendMode] = useState<'client' | 'seller' | 'download'>('client');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);

  // Hooks para status e revalidação
  const quotationStatus = useQuotationStatus(quotation || null);
  const approvalStatus = useQuotationApprovalStatus(quotation || null);
  const { data: revalidation } = useQuotationRevalidation(id);
  const sendQuotation = useSendQuotation();
  const createRevision = useCreateRevision();
  const approveQuotation = useApproveQuotation();

  // Verificar se usuário pode aprovar (diretor_comercial ou admin)
  const canApprove = hasRole('diretor_comercial') || hasRole('administrador');

  // Buscar contrato associado à cotação (se existir)
  const { data: contract } = useQuery({
    queryKey: ['quotation-contract', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, contract_number')
        .eq('quotation_id', id!)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!quotation
  });

  // Workflow simplificado não usa approvals separadas
  const commercialApprovals: any[] = [];
  const technicalApprovals: any[] = [];
  
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

  // Verificar se cotação é imutável (contratada/aceita)
  const isQuotationImmutable = quotation && (
    quotation.status === 'accepted' ||
    quotation.status === 'approved' ||
    !!contract
  );

  const handleEdit = async () => {
    if (!quotation) return;
    
    // Cotações contratadas não podem ser editadas
    if (isQuotationImmutable) {
      toast.error("Esta cotação não pode ser editada", {
        description: "Cotações contratadas são imutáveis. Alterações devem ser feitas via ATOs no contrato."
      });
      return;
    }
    
    // Permitir edição direta apenas se status é draft E nunca foi enviado
    const canEditDirectly = quotation.status === 'draft' && !quotation.sent_at;
    
    if (canEditDirectly) {
      navigate(`/configurator?edit=${quotation.id}`);
      return;
    }
    
    // Se já foi enviado, SEMPRE criar nova revisão
    try {
      toast.info('Criando nova revisão...');
      const newQuotation = await createRevision.mutateAsync(quotation.id);
      toast.success(`Revisão ${newQuotation.quotation_number} criada! Redirecionando para edição...`);
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
      toast.success(`Revisão ${newQuotation.quotation_number} criada! Redirecionando para edição...`);
      // Redirecionar para configurador para permitir edição da nova revisão
      setTimeout(() => navigate(`/configurator?edit=${newQuotation.id}`), 1000);
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

  const handleApprove = async () => {
    if (!quotation) return;
    
    try {
      await approveQuotation.mutateAsync(quotation.id);
      setApproveDialogOpen(false);
      // Redirecionar para o contrato criado após 2 segundos
      setTimeout(() => {
        navigate('/contracts');
      }, 2000);
    } catch (error) {
      // Erro já tratado no hook
    }
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
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 pb-20 md:pb-24">{/* Extra padding for fixed footer */}
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate("/cotacoes")}
          className="mb-2 md:mb-4"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Voltar para Cotações</span>
          <span className="sm:hidden">Voltar</span>
        </Button>

        {/* Header com navegação e status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-wrap">
          {/* Botões de Link Público */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPublicLink}
            className="gap-2 w-full sm:w-auto"
          >
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Copiar Link Público</span>
            <span className="sm:hidden">Copiar Link</span>
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
            approvalStatus={approvalStatus}
          />
        )}

        {/* Workflow de Customizações */}
        {quotation.quotation_customizations && quotation.quotation_customizations.length > 0 && (
          <CustomizationWorkflowCard quotationId={quotation.id} />
        )}

        {/* Card de Contrato Ativo - Se aprovada e contrato existe */}
        {quotation.status === 'approved' && contract && (
          <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <FileCheck className="h-5 w-5" />
                Contrato Ativo Criado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Esta cotação foi aprovada internamente e um contrato foi gerado automaticamente.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{contract.contract_number}</p>
                  <p className="text-sm text-muted-foreground">
                    Você pode gerenciar o contrato, criar ATOs e acompanhar o andamento da produção.
                  </p>
                </div>
                <Button onClick={() => navigate(`/contracts/${contract.id}`)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Contrato
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

          {/* Detalhes em Accordion */}
          <QuotationDetailsAccordion 
            quotation={quotation}
            defaultExpanded={defaultExpandedSections}
          />

          {/* Histórico de Versões */}
          <QuotationVersionHistory quotationId={quotation.id} />
        </div>

        {/* Fixed Footer with Actions - Ajustado para AdminLayout */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-10">
          <div className="flex flex-wrap gap-3 justify-end">
            {/* Botão Editar Rascunho - só se draft e não contratada */}
            {quotation.status === 'draft' && quotationStatus.canEdit && !isQuotationImmutable && (
              <Button 
                variant="outline" 
                onClick={handleEdit} 
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Rascunho
              </Button>
            )}

            {/* Botão de Enviar/Reenviar Proposta - qualquer status exceto draft */}
            {quotation.status !== 'draft' && (
              <Button 
                onClick={handleSendToClient} 
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <Send className="mr-2 h-4 w-4" />
                {quotation.status === 'ready_to_send' ? 'Enviar Proposta' : 'Reenviar Proposta'}
              </Button>
            )}

            {/* Botão Aprovar Cotação - só se enviada, usuário pode aprovar e NÃO tem contrato */}
            {quotation.status === 'sent' && canApprove && !contract && (
              <Button 
                onClick={() => setApproveDialogOpen(true)} 
                size="lg"
                className="flex-1 sm:flex-none"
                variant="default"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprovar Cotação
              </Button>
            )}

            {/* Botão Ver Contrato - se aprovada/contratada e contrato existe */}
            {(quotation.status === 'approved' || quotation.status === 'converted_to_contract') && contract && (
              <Button 
                onClick={() => navigate(`/contracts/${contract.id}`)} 
                size="lg"
                className="flex-1 sm:flex-none"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver Contrato
              </Button>
            )}

            {/* Botão Criar Revisão - se enviada ou expirada e NÃO tem contrato */}
            {(quotation.status === 'sent' || quotation.status === 'expired') && !contract && (
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

      {/* Dialog de Confirmação de Aprovação */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Cotação Internamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Marcar a cotação como <strong>aprovada internamente</strong></li>
                <li>Criar automaticamente um <strong>contrato ativo</strong></li>
                <li>Permitir a criação de ATOs (Aditivos ao Contrato)</li>
              </ul>
              <p className="mt-3 text-muted-foreground">
                Esta ação não pode ser desfeita.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveQuotation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              disabled={approveQuotation.isPending}
            >
              {approveQuotation.isPending ? 'Aprovando...' : 'Aprovar e Criar Contrato'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminLayout>
  );
}
