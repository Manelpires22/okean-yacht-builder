import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_DEFINITIONS, PERMISSION_LABELS, PERMISSION_CATEGORIES, AppRole, Permission } from "@/lib/role-permissions";
import { Shield, Users, Lock, AlertCircle, CheckCircle2, XCircle, Loader2, RotateCcw, Info, Settings, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRolePermissions, useToggleRolePermission, hasPermissionInDB, isPermissionCustomized, useResetRolePermissions } from "@/hooks/useRolePermissions";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function AdminRolesPermissions() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    role: AppRole | null;
    permission: Permission | null;
    currentState: boolean;
  }>({
    open: false,
    role: null,
    permission: null,
    currentState: false
  });
  const [resetDialog, setResetDialog] = useState<{
    open: boolean;
    role: AppRole | null;
  }>({
    open: false,
    role: null
  });

  const { data: dbPermissions, isLoading } = useRolePermissions();
  const toggleMutation = useToggleRolePermission();
  const resetMutation = useResetRolePermissions();

  const roles = Object.keys(ROLE_DEFINITIONS) as AppRole[];
  const allPermissions = Object.values(PERMISSION_CATEGORIES).flat();
  const uniquePermissions = Array.from(new Set(allPermissions)) as Permission[];

  const filteredPermissions = selectedCategory === "all" 
    ? uniquePermissions
    : (PERMISSION_CATEGORIES[selectedCategory as keyof typeof PERMISSION_CATEGORIES] || []);

  const handleCellClick = (role: AppRole, permission: Permission, currentState: boolean) => {
    // Não permitir editar admin:full_access para evitar auto-bloqueio
    if (permission === 'admin:full_access') {
      return;
    }
    
    setConfirmDialog({
      open: true,
      role,
      permission,
      currentState
    });
  };

  const handleConfirmToggle = () => {
    if (confirmDialog.role && confirmDialog.permission) {
      toggleMutation.mutate(
        {
          role: confirmDialog.role,
          permission: confirmDialog.permission,
          currentState: confirmDialog.currentState
        },
        {
          onSuccess: () => {
            setConfirmDialog({ open: false, role: null, permission: null, currentState: false });
          }
        }
      );
    }
  };

  const handleResetRole = (role: AppRole) => {
    setResetDialog({ open: true, role });
  };

  const handleConfirmReset = () => {
    if (resetDialog.role) {
      resetMutation.mutate(resetDialog.role, {
        onSuccess: () => {
          setResetDialog({ open: false, role: null });
        }
      });
    }
  };

  const renderPermissionMatrix = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!dbPermissions) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar permissões do banco de dados.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {Object.keys(PERMISSION_CATEGORIES).map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Alert className="w-auto">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Clique em qualquer célula para editar permissões
            </AlertDescription>
          </Alert>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px] font-semibold sticky left-0 bg-background z-10">Permissão</TableHead>
                {roles.map(role => (
                  <TableHead key={role} className="text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-2">
                      <Badge variant={ROLE_DEFINITIONS[role].color as any}>
                        {ROLE_DEFINITIONS[role].label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetRole(role)}
                        disabled={resetMutation.isPending}
                        className="text-xs whitespace-nowrap"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map(permission => (
                <TableRow key={permission}>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            {PERMISSION_LABELS[permission]}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{permission}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {roles.map(role => {
                    const hasPermission = hasPermissionInDB(dbPermissions, role, permission);
                    const isCustomized = isPermissionCustomized(dbPermissions, role, permission);
                    const isAdminFullAccess = permission === 'admin:full_access';
                    
                    return (
                      <TableCell key={`${role}-${permission}`} className="text-center p-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleCellClick(role, permission, hasPermission)}
                                disabled={toggleMutation.isPending || isAdminFullAccess}
                                className={`w-full h-full py-4 flex flex-col items-center justify-center transition-colors ${
                                  isAdminFullAccess 
                                    ? 'cursor-not-allowed opacity-50' 
                                    : 'hover:bg-accent/50 cursor-pointer'
                                }`}
                              >
                                {toggleMutation.isPending && 
                                 confirmDialog.role === role && 
                                 confirmDialog.permission === permission ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : hasPermission ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-gray-300" />
                                )}
                                {isCustomized && (
                                  <Badge variant="outline" className="text-[10px] mt-1">
                                    CUSTOM
                                  </Badge>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isAdminFullAccess 
                                  ? 'Permissão protegida (não editável)'
                                  : hasPermission 
                                    ? 'Clique para remover' 
                                    : 'Clique para conceder'
                                }
                              </p>
                              {isCustomized && <p className="text-yellow-500">Customizado</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderRoleCards = () => {
    if (isLoading || !dbPermissions) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => {
          const rolePermissions = dbPermissions
            .filter(p => p.role === role && p.is_granted)
            .map(p => p.permission);
          const hasAdminAccess = rolePermissions.includes('admin:full_access');

          return (
            <Card key={role} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {ROLE_DEFINITIONS[role].label}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {ROLE_DEFINITIONS[role].description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={cn("ml-2", ROLE_DEFINITIONS[role].color)}>
                    {role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Permissões ({rolePermissions.length})
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetRole(role)}
                      disabled={resetMutation.isPending}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {hasAdminAccess ? (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ Acesso Total ao Sistema
                      </Badge>
                    ) : (
                      rolePermissions.map(perm => (
                        <div key={perm} className="text-xs text-muted-foreground flex items-start gap-2">
                          <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>{PERMISSION_LABELS[perm as Permission]}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Key className="h-10 w-10" />
            Roles & Permissões
          </h1>
          <p className="text-muted-foreground mt-2">
            Sistema centralizado de controle de acesso baseado em roles (RBAC) - Agora Editável!
          </p>
        </div>

        {/* Info Card: Como Editar Permissões */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Como Funciona?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Agora você pode <strong>editar permissões diretamente na matriz</strong> clicando em qualquer célula. 
              As mudanças são aplicadas imediatamente para todos os usuários com aquela role.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/users">
                  <Settings className="mr-2 h-4 w-4" />
                  Gerenciar Usuários
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/audit-logs">
                  <Lock className="mr-2 h-4 w-4" />
                  Ver Logs de Auditoria
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Roles</CardDescription>
              <CardTitle className="text-3xl">{roles.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Permissões Únicas</CardDescription>
              <CardTitle className="text-3xl">
                {Object.keys(PERMISSION_LABELS).length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Categorias</CardDescription>
              <CardTitle className="text-3xl">
                {Object.keys(PERMISSION_CATEGORIES).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="matrix">
              <Shield className="h-4 w-4 mr-2" />
              Matriz Editável
            </TabsTrigger>
            <TabsTrigger value="cards">
              <Users className="h-4 w-4 mr-2" />
              Visão por Role
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4 mt-6">
            {renderPermissionMatrix()}
          </TabsContent>

          <TabsContent value="cards" className="space-y-4 mt-6">
            {renderRoleCards()}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sobre o Sistema de Permissões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Row-Level Security (RLS):</strong> As permissões são aplicadas automaticamente 
              através de políticas RLS no Supabase, garantindo segurança em nível de banco de dados.
            </p>
            <p>
              <strong>Função has_role():</strong> Valida permissões usando SECURITY DEFINER, 
              prevenindo escalação de privilégios e recursão infinita.
            </p>
            <p>
              <strong>Permissões Dinâmicas:</strong> Agora armazenadas em <code>role_permissions_config</code>, 
              permitindo customização sem precisar editar código. Badge "CUSTOM" indica permissões alteradas.
            </p>
            <p>
              <strong>Auditoria Completa:</strong> Todas as mudanças de permissões são registradas automaticamente 
              no log de auditoria com timestamp, usuário responsável e valores antigos/novos.
            </p>
            <p className="text-muted-foreground text-xs mt-4">
              💡 Definido em: <code>role_permissions_config table</code> • 
              Aplicado via: <code>RLS Policies</code> + <code>get_effective_permissions() function</code>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog para Toggle de Permissão */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.currentState ? 'Remover' : 'Conceder'} Permissão?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a <strong>{confirmDialog.currentState ? 'remover' : 'conceder'}</strong> a permissão:
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-semibold">
                  {confirmDialog.permission && PERMISSION_LABELS[confirmDialog.permission]}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {confirmDialog.permission}
                </p>
              </div>
              <p>
                Para a role: <strong>{confirmDialog.role && ROLE_DEFINITIONS[confirmDialog.role].label}</strong>
              </p>
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Esta mudança será registrada no log de auditoria e afetará <strong>todos os usuários</strong> com esta role imediatamente.
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog para Reset */}
      <AlertDialog open={resetDialog.open} onOpenChange={(open) =>
        setResetDialog({ ...resetDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Permissões para Padrão?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a <strong>resetar todas as permissões</strong> da role:
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-semibold">
                  {resetDialog.role && ROLE_DEFINITIONS[resetDialog.role].label}
                </p>
              </div>
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Esta ação irá <strong>deletar todas as customizações</strong> e restaurar as permissões padrão definidas no sistema. Esta mudança não pode ser desfeita!
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              disabled={resetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resetar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
