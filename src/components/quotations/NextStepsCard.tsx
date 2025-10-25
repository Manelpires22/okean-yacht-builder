import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Download, Send, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NextStepsCardProps {
  quotation: any;
  onSendToClient: () => void;
  onSendToSelf: () => void;
  onDownloadPDF: () => void;
  needsApproval?: boolean;
}

export function NextStepsCard({
  quotation,
  onSendToClient,
  onSendToSelf,
  onDownloadPDF,
  needsApproval = false
}: NextStepsCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Próximos Passos
        </CardTitle>
        <CardDescription>
          Proposta criada com sucesso! Escolha como deseja compartilhar:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsApproval && (
          <Alert variant="default" className="border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Esta proposta possui descontos ou customizações que precisam de aprovação.
              Você pode enviá-la mesmo assim, mas o status de aprovação será visível para o cliente.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button 
            onClick={onSendToClient} 
            className="w-full h-auto py-4 flex-col items-start gap-1"
            size="lg"
          >
            <span className="flex items-center gap-2 text-base font-semibold">
              <Mail className="h-5 w-5" />
              Enviar ao Cliente
            </span>
            <span className="text-xs font-normal opacity-90">
              Recomendado: permite rastreamento e aceitação digital
            </span>
          </Button>

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
