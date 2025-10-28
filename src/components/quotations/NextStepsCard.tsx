import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Download, Send, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QuotationApprovalStatus } from "@/hooks/useQuotationApprovalStatus";

interface NextStepsCardProps {
  quotation: any;
  onSendToClient: () => void;
  onSendToSelf: () => void;
  onDownloadPDF: () => void;
  approvalStatus: QuotationApprovalStatus;
}

export function NextStepsCard({
  quotation,
  onSendToClient,
  onSendToSelf,
  onDownloadPDF,
  approvalStatus
}: NextStepsCardProps) {
  const isAwaitingApprovals = approvalStatus.nextStep === 'awaiting_approvals';
  const cardBorderClass = isAwaitingApprovals 
    ? "border-yellow-600/50 bg-yellow-50/50 dark:bg-yellow-950/20" 
    : "border-primary/20 bg-primary/5";

  return (
    <Card className={cardBorderClass}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isAwaitingApprovals ? (
            <>
              <Clock className="h-5 w-5 text-yellow-600" />
              Aguardando Aprovações
            </>
          ) : (
            <>
              <Send className="h-5 w-5 text-primary" />
              Próximos Passos
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isAwaitingApprovals 
            ? "Esta proposta possui aprovações pendentes que devem ser concluídas antes do envio ao cliente."
            : "Proposta aprovada! Escolha como deseja compartilhar:"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAwaitingApprovals ? (
          <Alert variant="default" className="border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
              Aprovações Pendentes
            </AlertTitle>
            <AlertDescription className="text-yellow-800 dark:text-yellow-200 space-y-2">
              {approvalStatus.hasPendingCommercialApproval && (
                <div className="flex items-start gap-2">
                  <span className="font-medium">• Comercial:</span>
                  <span>Desconto de {Math.max(quotation.base_discount_percentage || 0, quotation.options_discount_percentage || 0)}% requer aprovação</span>
                </div>
              )}
              {approvalStatus.hasPendingWorkflows && (
                <div className="space-y-1">
                  <div className="font-medium">• Técnicas ({approvalStatus.pendingWorkflowsCount}):</div>
                  <ul className="ml-4 space-y-1">
                    {approvalStatus.pendingWorkflowDetails.map(detail => (
                      <li key={detail.customizationId} className="text-sm">
                        - {detail.itemName} ({detail.workflowStatus === 'pending_pm_review' ? 'Aguardando PM' : detail.workflowStatus})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="default" className="border-green-600/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ✅ Todas as aprovações foram concluídas! A proposta está pronta para ser enviada ao cliente.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button 
                    onClick={onSendToClient} 
                    className="w-full h-auto py-4 flex-col items-start gap-1"
                    size="lg"
                    disabled={isAwaitingApprovals}
                  >
                    <span className="flex items-center gap-2 text-base font-semibold">
                      <Mail className="h-5 w-5" />
                      Enviar ao Cliente
                    </span>
                    <span className="text-xs font-normal opacity-90">
                      Recomendado: permite rastreamento e aceitação digital
                    </span>
                  </Button>
                </div>
              </TooltipTrigger>
              {isAwaitingApprovals && (
                <TooltipContent>
                  <p>Aguarde a conclusão das aprovações pendentes</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={onSendToSelf} 
              variant="outline"
              className="h-auto py-3 flex-col items-start gap-1"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="h-4 w-4" />
                Enviar para Mim
              </span>
              <span className="text-xs font-normal opacity-70">
                Para revisão
              </span>
            </Button>

            <Button 
              onClick={onDownloadPDF} 
              variant="outline"
              className="h-auto py-3 flex-col items-start gap-1"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Download className="h-4 w-4" />
                Baixar PDF
              </span>
              <span className="text-xs font-normal opacity-70">
                Para envio manual
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
