import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMFA } from '@/hooks/useMFA';
import { MFAEnrollment } from '@/components/auth/MFAEnrollment';
import { Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';

export function SecuritySettings() {
  const { factors, hasMFAEnabled, unenrollMFA, isLoadingFactors } = useMFA();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

  const verifiedFactor = factors?.find(f => f.status === 'verified');

  const handleDisableMFA = async () => {
    if (verifiedFactor) {
      await unenrollMFA.mutateAsync(verifiedFactor.id);
      setDisableDialogOpen(false);
    }
  };

  if (isLoadingFactors) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Autenticação em Duas Etapas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasMFAEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <ShieldOff className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle>Autenticação em Duas Etapas (2FA)</CardTitle>
            </div>
            <Badge variant={hasMFAEnabled ? 'default' : 'secondary'}>
              {hasMFAEnabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <CardDescription>
            Proteja sua conta com um código adicional gerado pelo seu celular
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasMFAEnabled ? (
            <>
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Sua conta está protegida com autenticação em duas etapas. 
                  Você precisará do código do seu authenticator para fazer login.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Aplicativo Authenticator</p>
                  <p className="text-sm text-muted-foreground">
                    {verifiedFactor?.friendly_name || 'OKEAN Yachts CPQ'}
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setDisableDialogOpen(true)}
                >
                  Desativar
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Adicione uma camada extra de segurança à sua conta usando um aplicativo 
                  authenticator como Google Authenticator ou Authy.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Proteção contra acesso não autorizado mesmo se sua senha for comprometida</p>
                <p>• Códigos únicos gerados a cada 30 segundos</p>
                <p>• Funciona mesmo sem conexão com a internet</p>
              </div>

              <Button onClick={() => setEnrollOpen(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Ativar Autenticação em Duas Etapas
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <MFAEnrollment open={enrollOpen} onOpenChange={setEnrollOpen} />

      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Autenticação em Duas Etapas?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua conta ficará menos segura sem a proteção adicional do authenticator. 
              Você precisará apenas da sua senha para fazer login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisableMFA}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unenrollMFA.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
