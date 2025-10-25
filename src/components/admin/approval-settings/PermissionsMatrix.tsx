import { Check, X, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const roles = [
  { name: "Vendedor", variant: "secondary" },
  { name: "Diretor Comercial", variant: "destructive" },
  { name: "Administrador", variant: "default" },
  { name: "Engenheiro", variant: "outline" },
  { name: "PM Engenharia", variant: "default" },
];

const permissions = [
  {
    category: "Cotações",
    items: [
      { 
        action: "Criar cotações", 
        roles: { vendedor: true, diretor: true, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Editar próprias cotações (draft)", 
        roles: { vendedor: true, diretor: true, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Deletar próprias cotações (draft)", 
        roles: { vendedor: true, diretor: false, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Ver todas as cotações", 
        roles: { vendedor: false, diretor: true, admin: true, engenheiro: true, pm: true }
      },
      { 
        action: "Enviar cotação ao cliente", 
        roles: { vendedor: true, diretor: true, admin: true, engenheiro: false, pm: false }
      },
    ]
  },
  {
    category: "Descontos",
    items: [
      { 
        action: "Aplicar descontos (até limite)", 
        roles: { vendedor: true, diretor: true, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Aprovar descontos (até limite Diretor)", 
        roles: { vendedor: false, diretor: true, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Aprovar descontos (sem limite)", 
        roles: { vendedor: false, diretor: false, admin: true, engenheiro: false, pm: false }
      },
    ]
  },
  {
    category: "Customizações",
    items: [
      { 
        action: "Solicitar customizações", 
        roles: { vendedor: true, diretor: true, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Aprovar customizações técnicas", 
        roles: { vendedor: false, diretor: false, admin: true, engenheiro: true, pm: true }
      },
      { 
        action: "Definir custos e prazos", 
        roles: { vendedor: false, diretor: false, admin: true, engenheiro: true, pm: true }
      },
    ]
  },
  {
    category: "Administração",
    items: [
      { 
        action: "Gerenciar usuários", 
        roles: { vendedor: false, diretor: false, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Configurar limites de desconto", 
        roles: { vendedor: false, diretor: false, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Gerenciar modelos de iates", 
        roles: { vendedor: false, diretor: true, admin: true, engenheiro: false, pm: false }
      },
      { 
        action: "Gerenciar opcionais", 
        roles: { vendedor: false, diretor: true, admin: true, engenheiro: false, pm: false }
      },
    ]
  },
];

const CheckIcon = () => <Check className="h-4 w-4 text-green-600" />;
const XIcon = () => <X className="h-4 w-4 text-muted-foreground" />;

export function PermissionsMatrix() {
  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
        <Shield className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">Legenda de Roles</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {roles.map((role) => (
              <Badge key={role.name} variant={role.variant as any}>
                {role.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Permissions by Category */}
      {permissions.map((category) => (
        <div key={category.category} className="space-y-3">
          <h3 className="text-lg font-semibold">{category.category}</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Permissão</TableHead>
                  <TableHead className="text-center">Vendedor</TableHead>
                  <TableHead className="text-center">Diretor</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                  <TableHead className="text-center">Eng.</TableHead>
                  <TableHead className="text-center">PM Eng.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.action}</TableCell>
                    <TableCell className="text-center">
                      {item.roles.vendedor ? <CheckIcon /> : <XIcon />}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.roles.diretor ? <CheckIcon /> : <XIcon />}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.roles.admin ? <CheckIcon /> : <XIcon />}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.roles.engenheiro ? <CheckIcon /> : <XIcon />}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.roles.pm ? <CheckIcon /> : <XIcon />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
