import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Download, Loader2, Send } from "lucide-react";

interface SendQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationNumber: string;
  clientName: string;
  clientEmail?: string;
  onSend: (data: SendQuotationData) => Promise<void>;
}

export interface SendQuotationData {
  sendEmail: boolean;
  generatePDF: boolean;
  recipientEmail: string;
  emailSubject: string;
  emailMessage: string;
}

export function SendQuotationDialog({
  open,
  onOpenChange,
  quotationNumber,
  clientName,
  clientEmail,
  onSend
}: SendQuotationDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [sendEmail, setSendEmail] = useState(!!clientEmail);
  const [generatePDF, setGeneratePDF] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState(clientEmail || "");
  const [emailSubject, setEmailSubject] = useState(
    `Proposta OKEAN Yachts - ${quotationNumber}`
  );
  const [emailMessage, setEmailMessage] = useState(
    `Prezado(a) ${clientName},\n\nSegue em anexo nossa proposta para aquisição de iate OKEAN.\n\nA proposta tem validade de 30 dias e pode ser visualizada e aceita através do link enviado.\n\nFicamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nEquipe OKEAN Yachts`
  );

  const handleSend = async () => {
    if (sendEmail && !recipientEmail) {
      return;
    }

    setIsSending(true);
    try {
      await onSend({
        sendEmail,
        generatePDF,
        recipientEmail,
        emailSubject,
        emailMessage
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao enviar:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar Proposta ao Cliente</DialogTitle>
          <DialogDescription>
            Configure como deseja enviar a proposta {quotationNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opção: Gerar PDF */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="generatePDF"
              checked={generatePDF}
              onCheckedChange={(checked) => setGeneratePDF(checked as boolean)}
            />
            <Label htmlFor="generatePDF" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Gerar PDF da proposta
              </div>
            </Label>
          </div>

          {/* Opção: Enviar Email */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label htmlFor="sendEmail" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Enviar por email
              </div>
            </Label>
          </div>

          {/* Campos de Email */}
          {sendEmail && (
            <div className="space-y-4 pl-6 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">
                  Email do destinatário *
                </Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="cliente@empresa.com.br"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSubject">Assunto</Label>
                <Input
                  id="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailMessage">Mensagem</Label>
                <Textarea
                  id="emailMessage"
                  rows={8}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || (sendEmail && !recipientEmail)}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {sendEmail ? "Enviar Proposta" : "Gerar PDF"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
