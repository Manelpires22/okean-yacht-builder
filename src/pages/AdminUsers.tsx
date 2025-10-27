import { AdminLayout } from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_DEFINITIONS, getUserPermissions, type AppRole } from "@/lib/role-permissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { UserRoleBadges } from "@/components/admin/UserRoleBadges";
import { DepartmentsView } from "@/components/admin/users/DepartmentsView";
import { PMAssignmentsTable } from "@/components/admin/users/PMAssignmentsTable";
import { usePMAssignments } from "@/hooks/usePMAssignments";
import { useState } from "react";

interface UserWithRoles {
  id: string;
  full_name: string;
  email: string;
  department: string;
  is_active: boolean;
  roles: string[];
  pm_yacht_models: string[];
}

const AdminUsers = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('full_name');
      
      if (usersError) throw usersError;

      // Fetch roles for all users
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Fetch PM yacht model assignments
      const { data: pmAssignments } = await supabase
        .from('pm_yacht_model_assignments')
        .select('pm_user_id, yacht_model_id');

      // Combine data
      return usersData?.map(user => ({
        ...user,
        roles: rolesData?.filter(r => r.user_id === user.id).map(r => r.role) || [],
        pm_yacht_models: pmAssignments?.filter(a => a.pm_user_id === user.id).map(a => a.yacht_model_id) || []
      })) || [];
    }
  });

  const { data: pmAssignments, isLoading: pmAssignmentsLoading } = usePMAssignments();

  // Filter users based on search and role
  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.roles.includes(filterRole as AppRole);
    
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>
            <p className="text-muted-foreground">Gerir utilizadores, departamentos e atribuições de PM</p>
          </div>
          <Button onClick={() => {
            setSelectedUser(null);
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Utilizador
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Utilizadores</TabsTrigger>
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
            <TabsTrigger value="pm-assignments">Atribuições de PM</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Roles</SelectItem>
                  {Object.values(ROLE_DEFINITIONS).map(role => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {searchTerm || filterRole !== "all" 
                          ? "Nenhum utilizador encontrado com os filtros aplicados"
                          : "Nenhum utilizador encontrado"
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <UserRoleBadges roles={user.roles} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getUserPermissions(user.roles as AppRole[]).length} permissões
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setDialogOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="departments">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <DepartmentsView users={users || []} />
            )}
          </TabsContent>

          <TabsContent value="pm-assignments">
            {pmAssignmentsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <PMAssignmentsTable assignments={pmAssignments || []} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateUserDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
