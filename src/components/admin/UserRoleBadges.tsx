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
    label: "Gerente Comercial",
    variant: "default" as const,
    description: "Gestão comercial e quotações",
  },
  vendedor: {
    label: "Comercial",
    variant: "secondary" as const,
    description: "Criação e gestão de quotações",
  },
  engenheiro: {
    label: "Produção",
    variant: "outline" as const,
    description: "Acesso à área de produção",
  },
  pm_engenharia: {
    label: "PM Engenharia",
    variant: "default" as const,
    description: "Project Manager de Engenharia",
  },
  comprador: {
    label: "Supply",
    variant: "secondary" as const,
    description: "Comprador (Supply)",
  },
  planejador: {
    label: "Planning",
    variant: "secondary" as const,
    description: "Planejador (Planning)",
  },
  diretor_comercial: {
    label: "Diretor Comercial",
    variant: "destructive" as const,
    description: "Diretor Comercial",
  },
  broker: {
    label: "Broker",
    variant: "outline" as const,
    description: "Broker",
  },
  backoffice_comercial: {
    label: "Backoffice",
    variant: "outline" as const,
    description: "Backoffice Comercial",
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
