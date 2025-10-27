import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building2, Users, UserCheck, UserX } from "lucide-react";
import { UserRoleBadges } from "@/components/admin/UserRoleBadges";

interface User {
  id: string;
  full_name: string;
  email: string;
  department: string;
  is_active: boolean;
  roles: string[];
}

interface DepartmentsViewProps {
  users: User[];
}

export function DepartmentsView({ users }: DepartmentsViewProps) {
  const departmentStats = useMemo(() => {
    const stats = new Map<string, {
      total: number;
      active: number;
      inactive: number;
      users: User[];
    }>();

    users.forEach(user => {
      const dept = user.department || "Sem Departamento";
      const current = stats.get(dept) || { total: 0, active: 0, inactive: 0, users: [] };
      
      current.total++;
      if (user.is_active) current.active++;
      else current.inactive++;
      current.users.push(user);
      
      stats.set(dept, current);
    });

    return Array.from(stats.entries()).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.total - a.total);
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Departamentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Departamentos ativos na organização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              De {users.length} usuários totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Departamento</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departmentStats[0]?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {departmentStats[0]?.total || 0} usuários
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departments Accordion */}
      <Card>
        <CardHeader>
          <CardTitle>Departamentos</CardTitle>
          <CardDescription>
            Visualização agrupada de usuários por departamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departmentStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum departamento encontrado
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {departmentStats.map((dept, index) => (
                <AccordionItem key={dept.name} value={`dept-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {dept.total}
                        </Badge>
                        <Badge variant="default" className="gap-1">
                          <UserCheck className="h-3 w-3" />
                          {dept.active}
                        </Badge>
                        {dept.inactive > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <UserX className="h-3 w-3" />
                            {dept.inactive}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      {dept.users.map(user => (
                        <div 
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{user.full_name}</span>
                              <span className="text-sm text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserRoleBadges roles={user.roles} />
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
