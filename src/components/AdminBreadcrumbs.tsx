import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Home,
  Settings,
  Ship,
  Users,
  FileText,
  UserCheck,
  CheckSquare,
  BookOpen,
  Percent,
  ClipboardCheck,
  Workflow,
  ListChecks,
  ScrollText,
  ShieldCheck,
  Calendar,
  FileSignature,
} from "lucide-react";

// Mapa de rotas para breadcrumbs (extraído da estrutura do AppSidebar)
const routeMap: Record<string, { label: string; icon?: any; parent?: string }> = {
  "/": { label: "Início", icon: Home },
  "/admin": { label: "Admin", icon: Settings },
  "/cotacoes": { label: "Cotações", icon: FileText },
  "/contratos": { label: "Contratos", icon: FileSignature },
  "/clientes": { label: "Clientes", icon: UserCheck },
  "/aprovacoes": { label: "Aprovações", icon: CheckSquare },
  "/tarefas-workflow": { label: "Minhas Tarefas", icon: ListChecks },
  
  // Grupo Barcos
  "/admin/yacht-models": { label: "Modelos de Iates", icon: Ship, parent: "/admin" },
  "/admin/yacht-models/create": { label: "Novo Modelo", parent: "/admin/yacht-models" },
  
  "/admin/memorial-categories": { label: "Categorias Memorial", icon: BookOpen, parent: "/admin" },
  
  // Grupo Utilizadores
  "/admin/users": { label: "Gestão de Utilizadores", icon: Users, parent: "/admin" },
  "/admin/roles-permissions": { label: "Roles & Permissões", icon: ShieldCheck, parent: "/admin" },
  
  // Grupo Configurações
  "/admin/discount-settings": { label: "Descontos", icon: Percent, parent: "/admin" },
  "/admin/approval-settings": { label: "Aprovações", icon: ClipboardCheck, parent: "/admin" },
  "/admin/workflow-settings": { label: "Workflow", icon: Workflow, parent: "/admin" },
  "/admin/job-stops": { label: "Job-Stops", icon: Calendar, parent: "/admin" },
  "/admin/audit-logs": { label: "Logs de Auditoria", icon: ScrollText, parent: "/admin" },
};

interface BreadcrumbSegment {
  label: string;
  path: string;
  icon?: any;
}

function generateBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const breadcrumbs: BreadcrumbSegment[] = [];
  
  // Tentar match exato primeiro
  let currentRoute = routeMap[pathname];
  let currentPath = pathname;
  
  // Se não encontrar match exato, tentar match de rotas dinâmicas
  if (!currentRoute) {
    // Tentar match com rotas editáveis (ex: /admin/yacht-models/:id)
    if (pathname.startsWith("/admin/yacht-models/") && pathname !== "/admin/yacht-models/create") {
      currentRoute = { label: "Editar Modelo", parent: "/admin/yacht-models" };
    } else if (pathname.startsWith("/cotacoes/")) {
      currentRoute = { label: "Detalhes da Cotação", parent: "/cotacoes" };
    } else if (pathname.startsWith("/contratos/")) {
      currentRoute = { label: "Detalhes do Contrato", parent: "/contratos" };
    }
  }
  
  // Se ainda não encontrou, retornar apenas a página atual
  if (!currentRoute) {
    return [{ label: pathname.split("/").pop() || "Página", path: pathname }];
  }
  
  // Construir breadcrumbs seguindo a hierarquia de parents
  const segments: BreadcrumbSegment[] = [];
  let route = currentRoute;
  let path = currentPath;
  
  while (route) {
    segments.unshift({
      label: route.label,
      path: path,
      icon: route.icon,
    });
    
    if (route.parent) {
      path = route.parent;
      route = routeMap[route.parent];
    } else {
      break;
    }
  }
  
  return segments;
}

export function AdminBreadcrumbs() {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);
  
  // Não mostrar breadcrumbs na home
  if (location.pathname === "/") {
    return null;
  }
  
  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <div key={crumb.path} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    {crumb.icon && <crumb.icon className="h-3.5 w-3.5" />}
                    <span>{crumb.label}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path} className="flex items-center gap-1.5">
                      {crumb.icon && <crumb.icon className="h-3.5 w-3.5" />}
                      <span>{crumb.label}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
