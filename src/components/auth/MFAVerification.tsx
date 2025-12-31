import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useMFA } from '@/hooks/useMFA';
import { Shield, Loader2 } from 'lucide-react';

interface MFAVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerification({ onSuccess, onCancel }: MFAVerificationProps) {
  const { verifyMFA } = useMFA();
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    try {
      await verifyMFA.mutateAsync(code);
      onSuccess();
    } catch (error) {
      setCode('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verificação em Duas Etapas</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos do seu aplicativo authenticator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="sr-only">Código de verificação</Label>
            <div className="flex justify-center">
              <InputOTP 
                maxLength={6} 
                value={code} 
                onChange={setCode}
                autoFocus
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

          <Button 
            className="w-full" 
            onClick={handleVerify}
            disabled={code.length !== 6 || verifyMFA.isPending}
          >
            {verifyMFA.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar
          </Button>

          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={onCancel}
          >
            Voltar ao Login
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Abra o seu aplicativo authenticator (Google Authenticator, Authy, etc.) 
            para obter o código de verificação.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
