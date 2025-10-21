import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ROLE_CONFIG = {
  administrador: {
    label: "Admin",
    variant: "destructive" as const,
    description: "Acesso total ao sistema",
  },
  gerente_comercial: {
    label: "Gerente",
    variant: "default" as const,
    description: "Gestão comercial e quotações",
  },
  comercial: {
    label: "Comercial",
    variant: "secondary" as const,
    description: "Criação e gestão de quotações",
  },
  producao: {
    label: "Produção",
    variant: "outline" as const,
    description: "Acesso à área de produção",
  },
  financeiro: {
    label: "Financeiro",
    variant: "outline" as const,
    description: "Gestão financeira e faturação",
  },
};

interface UserRoleBadgesProps {
  roles: string[];
}

export function UserRoleBadges({ roles }: UserRoleBadgesProps) {
  if (!roles || roles.length === 0) {
    return <Badge variant="outline">Sem roles</Badge>;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => {
          const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
          if (!config) return null;

          return (
            <Tooltip key={role}>
              <TooltipTrigger asChild>
                <Badge variant={config.variant} className="text-xs cursor-help">
                  {config.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
