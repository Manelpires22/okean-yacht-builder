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
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Header com trigger, breadcrumbs e UserMenu */}
          <header className="sticky top-0 z-10 h-14 border-b bg-background flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4">
            <SidebarTrigger className="flex-shrink-0" />
            
            <div className="min-w-0 flex-1">
              <AdminBreadcrumbs />
            </div>
            
            <div className="ml-auto flex-shrink-0">
              <UserMenu />
            </div>
          </header>

          {/* Conteúdo da página - Com max-width responsivo */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
