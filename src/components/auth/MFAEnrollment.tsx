import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMFA } from '@/hooks/useMFA';
import { Shield, Copy, Check, Loader2 } from 'lucide-react';

interface MFAEnrollmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MFAEnrollment({ open, onOpenChange }: MFAEnrollmentProps) {
  const { enrollmentData, enrollMFA, verifyEnrollment, cancelEnrollment } = useMFA();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');

  const handleStartEnrollment = async () => {
    const result = await enrollMFA.mutateAsync();
    if (result) {
      setStep('qr');
    }
  };

  const handleVerify = async () => {
    if (!enrollmentData || code.length !== 6) return;
    
    await verifyEnrollment.mutateAsync({
      factorId: enrollmentData.id,
      code,
    });

    // Success - close dialog
    setStep('intro');
    setCode('');
    onOpenChange(false);
  };

  const handleClose = () => {
    cancelEnrollment();
    setStep('intro');
    setCode('');
    onOpenChange(false);
  };

  const copySecret = () => {
    if (enrollmentData?.totp.secret) {
      navigator.clipboard.writeText(enrollmentData.totp.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {step === 'intro' && 'Ativar Autenticação em Duas Etapas'}
            {step === 'qr' && 'Configurar Authenticator'}
            {step === 'verify' && 'Verificar Código'}
          </DialogTitle>
          <DialogDescription>
            {step === 'intro' && 'Adicione uma camada extra de segurança à sua conta.'}
            {step === 'qr' && 'Escaneie o QR Code com seu aplicativo authenticator.'}
            {step === 'verify' && 'Digite o código de 6 dígitos para confirmar.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'intro' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Use um aplicativo authenticator como <strong>Google Authenticator</strong>, <strong>Authy</strong> ou <strong>Microsoft Authenticator</strong> para gerar códigos de acesso.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Proteção contra acesso não autorizado</p>
              <p>✓ Códigos que mudam a cada 30 segundos</p>
              <p>✓ Funciona offline</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleStartEnrollment}
                disabled={enrollMFA.isPending}
              >
                {enrollMFA.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'qr' && enrollmentData && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <img 
                  src={enrollmentData.totp.qr_code} 
                  alt="QR Code para MFA" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Ou digite o código manualmente:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  {enrollmentData.totp.secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={() => setStep('verify')}>
                Próximo
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Digite o código de 6 dígitos do seu authenticator:</Label>
              <div className="flex justify-center py-4">
                <InputOTP 
                  maxLength={6} 
                  value={code} 
                  onChange={setCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('qr')}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleVerify}
                disabled={code.length !== 6 || verifyEnrollment.isPending}
              >
                {verifyEnrollment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verificar e Ativar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
