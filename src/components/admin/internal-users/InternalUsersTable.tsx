import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InternalUser } from "@/hooks/useInternalUsers";
import { Building2, Wrench, Package, Calendar, Users } from "lucide-react";

interface InternalUsersTableProps {
  users: InternalUser[];
}

const DEPARTMENT_CONFIG = {
  commercial: { label: "Comercial", icon: Users, color: "bg-blue-500" },
  engineering: { label: "Engenharia", icon: Wrench, color: "bg-purple-500" },
  supply: { label: "Supply", icon: Package, color: "bg-green-500" },
  planning: { label: "Planejamento", icon: Calendar, color: "bg-orange-500" },
  backoffice: { label: "Back Office", icon: Building2, color: "bg-gray-500" },
};

const ROLE_LABELS: Record<string, string> = {
  pm: "Project Manager",
  buyer: "Comprador",
  planner: "Planejador",
  director: "Diretor",
  manager: "Gerente",
};

export function InternalUsersTable({ users }: InternalUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum usuário interno cadastrado
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead>Especialidade</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const deptConfig = DEPARTMENT_CONFIG[user.department];
          const Icon = deptConfig.icon;

          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.user?.full_name || "N/A"}
              </TableCell>
              <TableCell>{user.user?.email || "N/A"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${deptConfig.color} text-white`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-sm">{deptConfig.label}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {ROLE_LABELS[user.role_specialty] || user.role_specialty}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
