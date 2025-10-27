import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ship, Settings, Package, Users, Home, FileText, UserCheck, CheckSquare, BookOpen, Percent, ClipboardCheck, Workflow, ListChecks, ScrollText, ShieldCheck, Menu, X, ChevronDown, Calendar, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/admin/UserMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePendingApprovalsCount } from "@/hooks/useApprovals";

interface AdminLayoutProps {
  children: ReactNode;
}

// Itens principais (não agrupados)
const mainNavItems = [
  { path: "/", icon: Home, label: "🏠 Voltar ao Início", highlight: true },
  { path: "/admin", icon: Settings, label: "Dashboard" },
  { path: "/cotacoes", icon: FileText, label: "Cotações" },
  { path: "/contratos", icon: FileSignature, label: "Contratos" },
  { path: "/clientes", icon: UserCheck, label: "Clientes" },
  { path: "/aprovacoes", icon: CheckSquare, label: "Aprovações", showBadge: true },
  { path: "/tarefas-workflow", icon: ListChecks, label: "Minhas Tarefas" },
];

// Grupos expansíveis
const navGroups = [
  {
    id: "barcos",
    label: "BARCOS",
    icon: Ship,
    items: [
      { path: "/admin/yacht-models", icon: Ship, label: "Modelos de Iates" },
      { path: "/admin/options", icon: Package, label: "Opcionais" },
      { path: "/admin/memorial-categories", icon: BookOpen, label: "Categorias Memorial" },
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
];

// Função para detectar qual grupo contém a rota ativa
const getActiveGroup = (pathname: string): string | null => {
  for (const group of navGroups) {
    if (group.items.some(item => pathname === item.path)) {
      return group.id;
    }
  }
  return null;
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { data: pendingCount = 0 } = usePendingApprovalsCount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado para controlar quais grupos estão expandidos
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const activeGroup = getActiveGroup(location.pathname);
    return activeGroup ? [activeGroup] : [];
  });

  // Auto-expandir grupo quando rota mudar
  useEffect(() => {
    const activeGroup = getActiveGroup(location.pathname);
    if (activeGroup && !expandedGroups.includes(activeGroup)) {
      setExpandedGroups(prev => [...prev, activeGroup]);
    }
  }, [location.pathname]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Responsiva */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50",
        "w-64 border-r border-border bg-card",
        "transform transition-transform duration-200 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between p-6 lg:block">
          <div>
            <h2 className="text-2xl font-bold text-primary">Admin</h2>
            <p className="text-sm text-muted-foreground">OKEAN CPQ</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Nav items */}
        <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Itens principais */}
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  item.highlight && "border-t border-b border-border mt-2 mb-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.showBadge && pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            );
          })}

          {/* Separador */}
          <div className="my-3 border-t border-border" />

          {/* Grupos expansíveis */}
          {navGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            const hasActiveItem = group.items.some(item => location.pathname === item.path);

            return (
              <Collapsible
                key={group.id}
                open={isExpanded}
                onOpenChange={() => toggleGroup(group.id)}
                className="space-y-1"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2 text-sm font-semibold",
                      hasActiveItem 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <group.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} 
                    />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-1 pl-4">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="border-b border-border">
          <div className="container flex items-center justify-between h-16 px-4">
            {/* Botão hamburger mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 lg:flex lg:justify-end">
              <UserMenu />
            </div>
          </div>
        </div>
        <div className="container py-8 px-4">
          {children}
        </div>
      </main>
    </div>
  );
};
