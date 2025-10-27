import { useNavigate } from "react-router-dom";
import { UserMenu } from "@/components/admin/UserMenu";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showHomeButton?: boolean;
}

export function AppHeader({ title, showHomeButton = true }: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo clicável */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-2xl font-bold text-primary">OKEAN Yachts</h1>
            </button>
            
            {/* Botão Home adicional (opcional) */}
            {showHomeButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="hidden md:flex"
              >
                <Home className="h-4 w-4 mr-2" />
                Início
              </Button>
            )}
            
            {/* Título da página (opcional) */}
            {title && (
              <>
                <span className="text-muted-foreground hidden sm:inline">/</span>
                <span className="font-medium truncate max-w-xs md:max-w-md">{title}</span>
              </>
            )}
          </div>

          {/* UserMenu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
