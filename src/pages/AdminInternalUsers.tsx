import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Briefcase } from "lucide-react";
import { useInternalUsers, usePMAssignments } from "@/hooks/useInternalUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { InternalUsersTable } from "@/components/admin/internal-users/InternalUsersTable";
import { PMAssignmentsTable } from "@/components/admin/internal-users/PMAssignmentsTable";
import { CreateInternalUserDialog } from "@/components/admin/internal-users/CreateInternalUserDialog";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminInternalUsers() {
  const { data: internalUsers, isLoading: loadingUsers } = useInternalUsers();
  const { data: pmAssignments, isLoading: loadingAssignments } = usePMAssignments();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuários Internos</h1>
            <p className="text-muted-foreground mt-2">
              Gerir usuários de departamentos (Engenharia, Supply, Planning)
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário Interno
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Usuários Internos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{internalUsers?.length || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                PMs de Engenharia
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {internalUsers?.filter(u => u.role_specialty === 'pm').length || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Modelos Atribuídos
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{pmAssignments?.length || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Usuários Internos</TabsTrigger>
            <TabsTrigger value="assignments">Atribuições de PM</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários por Departamento</CardTitle>
                <CardDescription>
                  Usuários internos configurados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <InternalUsersTable users={internalUsers || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Atribuições de PM por Modelo</CardTitle>
                <CardDescription>
                  Cada modelo de iate tem um PM responsável
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAssignments ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <PMAssignmentsTable assignments={(pmAssignments || []) as any} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateInternalUserDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </AdminLayout>
  );
}
