import { HullNumber } from "@/hooks/useHullNumbers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Anchor, 
  Ship, 
  Layers, 
  Lock, 
  Droplets, 
  Waves, 
  Truck,
  Calendar
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HullProgressTimelineProps {
  hullNumber: HullNumber;
  compact?: boolean;
}

interface MilestoneConfig {
  key: keyof HullNumber;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const MILESTONES: MilestoneConfig[] = [
  { key: 'hull_entry_date', label: 'Ingresso Casco', shortLabel: 'Casco', icon: <Anchor className="h-3 w-3" /> },
  { key: 'barco_aberto_date', label: 'Barco Aberto', shortLabel: 'Aberto', icon: <Ship className="h-3 w-3" /> },
  { key: 'fechamento_convesdeck_date', label: 'Fechamento Convés', shortLabel: 'Convés', icon: <Layers className="h-3 w-3" /> },
  { key: 'barco_fechado_date', label: 'Barco Fechado', shortLabel: 'Fechado', icon: <Lock className="h-3 w-3" /> },
  { key: 'teste_piscina_date', label: 'Teste Piscina', shortLabel: 'Piscina', icon: <Droplets className="h-3 w-3" /> },
  { key: 'teste_mar_date', label: 'Teste Mar', shortLabel: 'Mar', icon: <Waves className="h-3 w-3" /> },
  { key: 'entrega_comercial_date', label: 'Entrega Comercial', shortLabel: 'Entrega', icon: <Truck className="h-3 w-3" /> },
];

export function HullProgressTimeline({ hullNumber, compact = false }: HullProgressTimelineProps) {
  // Contar marcos concluídos
  const completedCount = MILESTONES.filter(m => hullNumber[m.key]).length;
  const totalCount = MILESTONES.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {MILESTONES.map((milestone, index) => {
                const isCompleted = !!hullNumber[milestone.key];
                return (
                  <div
                    key={milestone.key}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      isCompleted 
                        ? "bg-primary" 
                        : "bg-muted-foreground/20"
                    )}
                  />
                );
              })}
              <span className="text-xs text-muted-foreground ml-1">
                {completedCount}/{totalCount}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm">
            <div className="space-y-1">
              <p className="font-medium">{progressPercent}% concluído</p>
              <div className="space-y-0.5 text-xs">
                {MILESTONES.map(m => {
                  const value = hullNumber[m.key] as string | null;
                  return (
                    <div key={m.key} className="flex items-center gap-2">
                      <span className={cn(
                        "flex items-center gap-1",
                        value ? "text-primary" : "text-muted-foreground"
                      )}>
                        {m.icon}
                      </span>
                      <span>{m.label}:</span>
                      <span className={value ? "font-medium" : "text-muted-foreground"}>
                        {value ? format(new Date(value), "dd/MM/yy", { locale: ptBR }) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Versão expandida
  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {progressPercent}%
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Linha conectora */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
        
        {/* Marcos */}
        <div className="relative flex justify-between">
          {MILESTONES.map((milestone, index) => {
            const value = hullNumber[milestone.key] as string | null;
            const isCompleted = !!value;
            
            return (
              <TooltipProvider key={milestone.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 border-2",
                          isCompleted 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-background text-muted-foreground border-muted"
                        )}
                      >
                        {milestone.icon}
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center max-w-12">
                        {milestone.shortLabel}
                      </span>
                      {value && (
                        <span className="text-[10px] text-primary font-medium">
                          {format(new Date(value), "dd/MM", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{milestone.label}</p>
                    {value && (
                      <p className="text-xs">
                        {format(new Date(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Job Stops */}
      {(hullNumber.job_stop_1_date || hullNumber.job_stop_2_date || hullNumber.job_stop_3_date || hullNumber.job_stop_4_date) && (
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Job Stops
          </p>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map(num => {
              const key = `job_stop_${num}_date` as keyof HullNumber;
              const value = hullNumber[key] as string | null;
              return (
                <div key={num} className="text-xs">
                  <span className="text-muted-foreground">JS{num}:</span>{' '}
                  <span className={value ? "font-medium" : "text-muted-foreground"}>
                    {value ? format(new Date(value), "dd/MM/yy", { locale: ptBR }) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
