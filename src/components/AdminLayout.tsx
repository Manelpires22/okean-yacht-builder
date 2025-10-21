import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ship, Settings, Package, Users, Database, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/admin", icon: Settings, label: "Dashboard" },
  { path: "/admin/yacht-models", icon: Ship, label: "Modelos" },
  { path: "/admin/options", icon: Package, label: "Opcionais" },
  { path: "/admin/users", icon: Users, label: "Utilizadores" },
  { path: "/admin/seed-data", icon: Database, label: "Dados de Teste" },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary">Admin</h2>
          <p className="text-sm text-muted-foreground">OKEAN CPQ</p>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8">
          {children}
        </div>
      </main>
    </div>
  );
};
