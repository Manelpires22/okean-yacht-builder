import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Download, Loader2, Send } from "lucide-react";

interface SendATOToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atoNumber: string;
  atoTitle: string;
  clientName?: string;
  clientEmail?: string;
  onSend: (data: SendATOData) => Promise<void>;
}

export interface SendATOData {
  sendEmail: boolean;
  generatePDF: boolean;
  recipientEmail: string;
  emailSubject: string;
  emailMessage: string;
}

export function SendATOToClientDialog({
  open,
  onOpenChange,
  atoNumber,
  atoTitle,
  clientName = "Cliente",
  clientEmail,
  onSend,
}: SendATOToClientDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [generatePDF, setGeneratePDF] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState(clientEmail || "");
  
  const defaultSubject = `Aditivo ${atoNumber} - ${atoTitle}`;
  const [emailSubject, setEmailSubject] = useState(defaultSubject);
  
  const defaultMessage = `Prezado(a) ${clientName},

Segue em anexo o Aditivo ao Contrato (ATO) ${atoNumber} - ${atoTitle}.

Este aditivo contempla modificações, configurações e/ou customizações adicionais ao contrato original.

Por favor, revise e retorne com sua aprovação para prosseguirmos com a execução.

Ficamos à disposição para quaisquer esclarecimentos.

Atenciosamente,
Equipe OKEAN Yachts`;
  
  const [emailMessage, setEmailMessage] = useState(defaultMessage);

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
      console.error("Erro ao enviar ATO:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar ATO ao Cliente</DialogTitle>
          <DialogDescription>
            Configure como deseja enviar o aditivo {atoNumber} ao cliente
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
                Gerar PDF do aditivo
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
                  Email do cliente *
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
                  rows={10}
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
                {sendEmail ? "Enviar ATO" : "Gerar PDF"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
