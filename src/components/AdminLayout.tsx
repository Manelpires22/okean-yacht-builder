import { ReactNode } from "react";
import { UserMenu } from "./admin/UserMenu";
import { AppSidebar } from "./AppSidebar";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header com trigger, breadcrumbs e UserMenu */}
          <header className="sticky top-0 z-10 h-14 border-b bg-background flex items-center px-4 gap-4">
            <SidebarTrigger />
            
            <AdminBreadcrumbs />
            
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>

          {/* Conteúdo da página */}
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
