import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ClipboardList } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWorkflowPendingCount } from "@/hooks/useWorkflowPendingCount";

export function UserMenu() {
  const { user, userRoles, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: pendingCount } = useWorkflowPendingCount();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .substring(0, 2)
      .toUpperCase();
  };

  const getPrimaryRole = () => {
    if (userRoles.includes('administrador')) return 'Admin';
    if (userRoles.includes('gerente_comercial')) return 'Gerente';
    if (userRoles.includes('comercial')) return 'Comercial';
    if (userRoles.includes('pm_engenharia')) return 'PM';
    if (userRoles.includes('comprador')) return 'Comprador';
    if (userRoles.includes('planejador')) return 'Planejador';
    return 'Utilizador';
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.email || '')}
            </AvatarFallback>
          </Avatar>
          {pendingCount && pendingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <Badge variant="secondary" className="w-fit">
              {getPrimaryRole()}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {pendingCount && pendingCount > 0 && (
          <>
            <DropdownMenuItem onClick={() => navigate("/tarefas-workflow")} className="cursor-pointer">
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Minhas Tarefas</span>
              <Badge variant="secondary" className="ml-auto">
                {pendingCount}
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Minha Conta</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Terminar Sessão</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
