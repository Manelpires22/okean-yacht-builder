import { cn } from "@/lib/utils";

interface AutoSizedValueProps {
  value: string;
  maxLength?: number;
  className?: string;
}

/**
 * Componente que automaticamente ajusta o tamanho da fonte
 * baseado no comprimento do valor para prevenir overflow em cards
 */
export function AutoSizedValue({ 
  value, 
  maxLength = 14,
  className 
}: AutoSizedValueProps) {
  const getFontSize = () => {
    if (value.length > 22) return "text-sm";
    if (value.length > 18) return "text-base";
    if (value.length > maxLength) return "text-lg";
    return "text-2xl";
  };

  return (
    <div 
      className={cn("font-bold truncate", getFontSize(), className)}
      title={value}
    >
      {value}
    </div>
  );
}
