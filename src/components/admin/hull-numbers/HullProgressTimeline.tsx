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
  const today = new Date();
  
  // Calcular progresso baseado na posição temporal (hoje entre início e fim)
  const calculateTimeProgress = (): number => {
    const firstDate = hullNumber.hull_entry_date;
    const lastDate = hullNumber.entrega_comercial_date || hullNumber.estimated_delivery_date;
    
    if (!firstDate || !lastDate) {
      // Fallback: usar contagem de milestones preenchidos
      const completedCount = MILESTONES.filter(m => hullNumber[m.key]).length;
      return Math.round((completedCount / MILESTONES.length) * 100);
    }
    
    const start = new Date(firstDate).getTime();
    const end = new Date(lastDate).getTime();
    const now = today.getTime();
    
    // Se ainda não começou
    if (now < start) return 0;
    
    // Se já terminou
    if (now >= end) return 100;
    
    // Calcular porcentagem baseada no tempo decorrido
    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  // Determinar índice do próximo milestone (primeiro com data futura)
  const getNextMilestoneIndex = (): number => {
    for (let i = 0; i < MILESTONES.length; i++) {
      const value = hullNumber[MILESTONES[i].key] as string | null;
      if (value && new Date(value) > today) {
        return i;
      }
    }
    return MILESTONES.length; // Todos concluídos ou passados
  };

  // Verificar se um milestone já passou (data anterior a hoje)
  const isMilestonePast = (value: string | null): boolean => {
    if (!value) return false;
    return new Date(value) <= today;
  };

  const progressPercent = calculateTimeProgress();
  const nextMilestoneIndex = getNextMilestoneIndex();
  const completedCount = MILESTONES.filter(m => isMilestonePast(hullNumber[m.key] as string | null)).length;
  const totalCount = MILESTONES.length;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {MILESTONES.map((milestone, index) => {
                const value = hullNumber[milestone.key] as string | null;
                const isPast = isMilestonePast(value);
                const isNext = index === nextMilestoneIndex;
                return (
                  <div
                    key={milestone.key}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      isPast 
                        ? "bg-primary" 
                        : isNext
                          ? "bg-primary/50 animate-pulse"
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
                  const isPast = isMilestonePast(value);
                  return (
                    <div key={m.key} className="flex items-center gap-2">
                      <span className={cn(
                        "flex items-center gap-1",
                        isPast ? "text-primary" : "text-muted-foreground"
                      )}>
                        {m.icon}
                      </span>
                      <span>{m.label}:</span>
                      <span className={isPast ? "font-medium" : "text-muted-foreground"}>
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
            const isPast = isMilestonePast(value);
            const isNext = index === nextMilestoneIndex;
            
            return (
              <TooltipProvider key={milestone.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 border-2",
                          isPast 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : isNext
                              ? "bg-primary/20 text-primary border-primary animate-pulse"
                              : "bg-background text-muted-foreground border-muted"
                        )}
                      >
                        {milestone.icon}
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center max-w-12">
                        {milestone.shortLabel}
                      </span>
                      {value && (
                        <span className={cn(
                          "text-[10px] font-medium",
                          isPast ? "text-primary" : isNext ? "text-primary" : "text-muted-foreground"
                        )}>
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
                    {isPast && <p className="text-xs text-primary">✓ Concluído</p>}
                    {isNext && !isPast && <p className="text-xs text-primary">→ Próximo</p>}
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
