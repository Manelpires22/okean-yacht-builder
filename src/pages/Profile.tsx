import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUpdateProfile, useChangePassword } from "@/hooks/useUpdateProfile";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from "@/lib/schemas/profile-schema";
import { AlertCircle, User, Lock, Settings } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    values: profile ? {
      full_name: profile.full_name,
      department: profile.department,
      email: profile.email,
    } : undefined,
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = (data: UpdateProfileInput) => {
    updateProfile.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePasswordInput) => {
    changePassword.mutate({ newPassword: data.newPassword }, {
      onSuccess: () => {
        passwordForm.reset();
      }
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'administrador') return 'default';
    if (role === 'gerente_comercial') return 'secondary';
    return 'outline';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      administrador: 'Administrador',
      gerente_comercial: 'Gerente Comercial',
      vendedor: 'Vendedor',
      engenheiro: 'Engenheiro',
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <>
        <AppHeader title="Minha Conta" />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <AppHeader title="Minha Conta" />
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados do perfil. Tente novamente.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Minha Conta" />
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Informações Pessoais</CardTitle>
            </div>
            <CardDescription>
              Gerencie suas informações pessoais e de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                      {field.value !== profile.email && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Um email de confirmação será enviado para o novo endereço
                          </AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Funções</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {profile.roles.map((role) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)}>
                        {getRoleLabel(role)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Cadastrado em</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(profile.created_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>

                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Segurança</CardTitle>
            </div>
            <CardDescription>
              Atualize sua senha para manter sua conta segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Mínimo 8 caracteres" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Digite a senha novamente" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Configurações da Conta */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Configurações da Conta</CardTitle>
            </div>
            <CardDescription>
              Informações técnicas e status da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Status da Conta</FormLabel>
              <div>
                <Badge variant={profile.is_active ? "default" : "destructive"}>
                  {profile.is_active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <FormLabel>ID do Usuário</FormLabel>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {profile.id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
