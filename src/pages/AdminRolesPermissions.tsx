import { AdminLayout } from "@/components/AdminLayout";
import { ROLE_DEFINITIONS, PERMISSION_CATEGORIES, PERMISSION_LABELS, type AppRole, type Permission } from "@/lib/role-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, X, Shield, Users, Key } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminRolesPermissions() {
  const roles = Object.values(ROLE_DEFINITIONS);

  const renderPermissionMatrix = () => {
    return (
      <div className="space-y-6">
        {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Permissão</TableHead>
                      {roles.map(role => (
                        <TableHead key={role.name} className="text-center min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium">{role.label}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map(permission => (
                      <TableRow key={permission}>
                        <TableCell className="font-medium text-sm">
                          {PERMISSION_LABELS[permission as Permission]}
                        </TableCell>
                        {roles.map(role => {
                          const hasPermission = 
                            role.permissions.includes('admin:full_access') ||
                            role.permissions.includes(permission as Permission);
                          
                          return (
                            <TableCell key={`${role.name}-${permission}`} className="text-center">
                              {hasPermission ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderRoleCards = () => {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => (
          <Card key={role.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {role.label}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {role.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className={cn("ml-2", role.color)}>
                  {role.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Permissões ({role.permissions.length})
                </p>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {role.permissions.includes('admin:full_access') ? (
                    <Badge variant="secondary" className="text-xs">
                      ⭐ Acesso Total ao Sistema
                    </Badge>
                  ) : (
                    role.permissions.map(perm => (
                      <div key={perm} className="text-xs text-muted-foreground flex items-start gap-2">
                        <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                        <span>{PERMISSION_LABELS[perm]}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            Sistema centralizado de controle de acesso baseado em roles (RBAC)
          </p>
        </div>

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
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="cards">
              <Users className="h-4 w-4 mr-2" />
              Visão por Role
            </TabsTrigger>
            <TabsTrigger value="matrix">
              <Shield className="h-4 w-4 mr-2" />
              Matriz de Permissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-4 mt-6">
            {renderRoleCards()}
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4 mt-6">
            {renderPermissionMatrix()}
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
              <strong>Múltiplos Roles:</strong> Usuários podem ter múltiplos roles simultaneamente. 
              As permissões são combinadas (união de todas as permissões dos roles atribuídos).
            </p>
            <p className="text-muted-foreground text-xs mt-4">
              💡 Definido em: <code>src/lib/role-permissions.ts</code> • 
              Aplicado via: <code>RLS Policies</code> + <code>has_role() function</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
