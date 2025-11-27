import { Home, FileText, FileSignature, Users, ListChecks, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useWorkflowPendingCount } from "@/hooks/useWorkflowPendingCount";

const mainNavItems = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Cotações",
    url: "/cotacoes",
    icon: FileText,
  },
  {
    title: "Contratos",
    url: "/contratos",
    icon: FileSignature,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
  },
  {
    title: "Aprovações",
    url: "/aprovacoes",
    icon: ListChecks,
  },
  {
    title: "Administração",
    url: "/admin",
    icon: Settings,
  },
];

export function MainSidebar() {
  const location = useLocation();
  const { open } = useSidebar();
  const { data: pendingCount } = useWorkflowPendingCount();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>OKEAN Yachts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                const showBadge = item.url === "/aprovacoes" && pendingCount && pendingCount > 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {showBadge && open && (
                          <Badge variant="destructive" className="ml-auto">
                            {pendingCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
