import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ship, Settings, Package, Users, Database, Home, FileText, UserCheck, CheckSquare, Folder, BookOpen, Percent, Briefcase, ClipboardCheck, Workflow, ListChecks, ScrollText, ShieldCheck, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/admin/UserMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePendingApprovalsCount } from "@/hooks/useApprovals";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", icon: Home, label: "🏠 Voltar ao Início", highlight: true },
  { path: "/cotacoes", icon: FileText, label: "Cotações" },
  { path: "/clientes", icon: UserCheck, label: "Clientes" },
  { path: "/aprovacoes", icon: CheckSquare, label: "Aprovações", showBadge: true },
  { path: "/tarefas-workflow", icon: ListChecks, label: "Minhas Tarefas Workflow" },
  { path: "/admin", icon: Settings, label: "Dashboard" },
  { path: "/admin/yacht-models", icon: Ship, label: "Modelos" },
  { path: "/admin/options", icon: Package, label: "Opcionais" },
  { path: "/admin/memorial-categories", icon: BookOpen, label: "Categorias Memorial" },
  { path: "/admin/discount-settings", icon: Percent, label: "Gestão de Descontos" },
  { path: "/admin/approval-settings", icon: ClipboardCheck, label: "Gestão de Aprovações" },
  { path: "/admin/workflow-settings", icon: Workflow, label: "Configurações Workflow" },
  { path: "/admin/internal-users", icon: Briefcase, label: "Usuários Internos (PM)" },
  { path: "/admin/users", icon: Users, label: "Utilizadores" },
  { path: "/admin/roles-permissions", icon: ShieldCheck, label: "Roles & Permissões" },
  { path: "/admin/audit-logs", icon: ScrollText, label: "Logs de Auditoria" },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { data: pendingCount = 0 } = usePendingApprovalsCount();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
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
