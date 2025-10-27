import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROLE_DEFINITIONS, getUserPermissions, type AppRole } from "@/lib/role-permissions";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
  selectedRoles: AppRole[];
  onChange: (roles: AppRole[]) => void;
  className?: string;
}

export function RoleSelector({ selectedRoles, onChange, className }: RoleSelectorProps) {
  const roles = Object.values(ROLE_DEFINITIONS);

  const handleRoleToggle = (roleName: AppRole, checked: boolean) => {
    if (checked) {
      onChange([...selectedRoles, roleName]);
    } else {
      onChange(selectedRoles.filter(r => r !== roleName));
    }
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", className)}>
      {roles.map(role => {
        const isSelected = selectedRoles.includes(role.name);
        const permissionCount = getUserPermissions([role.name]).length;

        return (
          <TooltipProvider key={role.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50",
                    isSelected && "bg-accent border-primary"
                  )}
                  onClick={() => handleRoleToggle(role.name, !isSelected)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleRoleToggle(role.name, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="cursor-pointer font-medium">
                        {role.label}
                      </Label>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", role.color)}
                      >
                        {permissionCount}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {role.description}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm">
                <div className="space-y-2">
                  <p className="font-semibold">{role.label}</p>
                  <p className="text-xs">{role.description}</p>
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium mb-1">
                      {permissionCount} permissões incluídas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clique para ver detalhes na página de Roles & Permissões
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
