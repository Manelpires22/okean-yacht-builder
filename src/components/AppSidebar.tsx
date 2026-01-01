import { Link, useLocation } from "react-router-dom";
import {
  Ship,
  Settings,
  Users,
  Home,
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
  ChevronRight,
  Anchor,
  Layout,
  Calculator,
  TrendingUp,
  DollarSign,
  Cog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkflowPendingCount } from "@/hooks/useWorkflowPendingCount";

// Itens principais (não agrupados) - MESMA estrutura do AdminLayout original
const mainNavItems = [
  { path: "/", icon: Home, label: "🏠 Voltar ao Início", highlight: true },
  { path: "/admin", icon: Settings, label: "Dashboard" },
  { path: "/cotacoes", icon: FileText, label: "Cotações" },
  { path: "/contratos", icon: FileSignature, label: "Contratos" },
  { path: "/clientes", icon: UserCheck, label: "Clientes" },
  { path: "/aprovacoes", icon: CheckSquare, label: "Aprovações", showBadge: true },
  { path: "/tarefas-workflow", icon: ListChecks, label: "Minhas Tarefas" },
];

// Grupos expansíveis - MESMA estrutura do AdminLayout original
const navGroups = [
  {
    id: "barcos",
    label: "BARCOS",
    icon: Ship,
    items: [
      { path: "/admin/yacht-models", icon: Ship, label: "Modelos de Iates" },
      { path: "/admin/hull-numbers", icon: Anchor, label: "Matrículas (Hull Numbers)" },
      { path: "/admin/memorial-categories", icon: BookOpen, label: "Categorias Memorial" },
    ],
  },
  {
    id: "simulador",
    label: "SIMULADOR",
    icon: Calculator,
    items: [
      { path: "/admin/simulator-rates", icon: TrendingUp, label: "Câmbios" },
      { path: "/admin/simulator-costs", icon: DollarSign, label: "Custos por Modelo" },
      { path: "/admin/simulator-commissions", icon: Percent, label: "Comissões" },
      { path: "/admin/simulator-rules", icon: Cog, label: "Regras de Negócio" },
    ],
  },
  {
    id: "utilizadores",
    label: "UTILIZADORES",
    icon: Users,
    items: [
      { path: "/admin/users", icon: Users, label: "Gestão de Utilizadores" },
      { path: "/admin/roles-permissions", icon: ShieldCheck, label: "Roles & Permissões" },
    ],
  },
  {
    id: "configuracoes",
    label: "CONFIGURAÇÕES",
    icon: Settings,
    items: [
      { path: "/admin/discount-settings", icon: Percent, label: "Descontos" },
      { path: "/admin/approval-settings", icon: ClipboardCheck, label: "Aprovações" },
      { path: "/admin/workflow-settings", icon: Workflow, label: "Workflow" },
      { path: "/admin/job-stops", icon: Calendar, label: "Job-Stops" },
      { path: "/admin/audit-logs", icon: ScrollText, label: "Logs de Auditoria" },
    ],
  },
  {
    id: "documentos",
    label: "DOCUMENTOS",
    icon: FileText,
    items: [
      { path: "/admin/pdf-templates", icon: Layout, label: "Templates PDF" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { data: pendingCount = 0 } = useWorkflowPendingCount();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getActiveGroup = (pathname: string): string | null => {
    for (const group of navGroups) {
      if (group.items.some((item) => pathname === item.path)) {
        return group.id;
      }
    }
    return null;
  };

  const activeGroup = getActiveGroup(location.pathname);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Header da Sidebar */}
        <div className="p-4 border-b">
          {!isCollapsed ? (
            <>
              <h2 className="text-2xl font-bold text-primary">Admin</h2>
              <p className="text-sm text-muted-foreground">OKEAN CPQ</p>
            </>
          ) : (
            <div className="text-center text-primary font-bold text-xl">A</div>
          )}
        </div>

        {/* Links principais */}
        <SidebarGroup>
          <SidebarMenu>
            {mainNavItems.map((item) => {
              const active = isActive(item.path);
              const showBadge = item.showBadge && pendingCount > 0;

              return (
                <SidebarMenuItem key={item.path}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton 
                        asChild 
                        isActive={active}
                        className={item.highlight ? "border-t border-b" : ""}
                      >
                        <Link to={item.path}>
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.label}</span>}
                          {!isCollapsed && showBadge && (
                            <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {pendingCount}
                            </Badge>
                          )}
                          {isCollapsed && showBadge && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                        {showBadge && <p className="text-xs text-destructive">({pendingCount} pendentes)</p>}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Separador */}
        {!isCollapsed && (
          <div className="mx-3 my-2 border-t border-border" />
        )}

        {/* Grupos colapsáveis */}
        {navGroups.map((group) => {
          const isGroupActive = activeGroup === group.id;

          return (
            <Collapsible
              key={group.id}
              defaultOpen={isGroupActive}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <group.icon className="h-4 w-4" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{group.label}</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </>
                    )}
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenuSub>
                      {group.items.map((item) => {
                        const active = isActive(item.path);

                        return (
                          <SidebarMenuSubItem key={item.path}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SidebarMenuSubButton asChild isActive={active}>
                                  <Link to={item.path}>
                                    <item.icon className="h-4 w-4" />
                                    {!isCollapsed && <span>{item.label}</span>}
                                  </Link>
                                </SidebarMenuSubButton>
                              </TooltipTrigger>
                              {isCollapsed && (
                                <TooltipContent side="right">
                                  <p>{item.label}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
