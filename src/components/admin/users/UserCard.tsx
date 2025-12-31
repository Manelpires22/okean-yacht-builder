import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserRoleBadges } from '@/components/admin/UserRoleBadges';
import { ROLE_DEFINITIONS, type AppRole } from '@/lib/role-permissions';
import { 
  MoreVertical, 
  Pencil, 
  Shield, 
  ShieldOff, 
  UserCheck, 
  UserX,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    department: string;
    is_active: boolean;
    roles: string[];
    pm_yacht_models?: string[];
    has_mfa?: boolean;
  };
  onEdit: (user: any) => void;
  onToggleActive?: (userId: string, isActive: boolean) => void;
  onResetMFA?: (userId: string) => void;
}

const DEPARTMENT_COLORS: Record<string, string> = {
  'Comercial': 'bg-blue-500',
  'Engenharia': 'bg-orange-500',
  'Supply': 'bg-amber-500',
  'Planning': 'bg-teal-500',
  'Financeiro': 'bg-emerald-500',
  'Backoffice': 'bg-cyan-500',
  'Produção': 'bg-lime-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarColor(department: string): string {
  return DEPARTMENT_COLORS[department] || 'bg-primary';
}

export function UserCard({ user, onEdit, onToggleActive, onResetMFA }: UserCardProps) {
  const initials = getInitials(user.full_name);
  const avatarColor = getAvatarColor(user.department);
  const isPM = user.roles.includes('pm_engenharia');

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      !user.is_active && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={cn(avatarColor, "text-white font-semibold")}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              
              {onToggleActive && (
                <DropdownMenuItem onClick={() => onToggleActive(user.id, !user.is_active)}>
                  {user.is_active ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
              )}
              
              {user.has_mfa && onResetMFA && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onResetMFA(user.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Resetar MFA
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {user.department}
            </Badge>
            {user.has_mfa && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                <ShieldCheck className="mr-1 h-3 w-3" />
                MFA
              </Badge>
            )}
          </div>

          <UserRoleBadges roles={user.roles} />

          {isPM && user.pm_yacht_models && user.pm_yacht_models.length > 0 && (
            <p className="text-xs text-muted-foreground">
              PM de {user.pm_yacht_models.length} modelo(s)
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <Badge variant={user.is_active ? 'default' : 'secondary'} className="text-xs">
              {user.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => onEdit(user)}
            >
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
