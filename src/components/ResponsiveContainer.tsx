import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'max-w-4xl' | 'max-w-7xl' | 'max-w-screen-2xl';
  className?: string;
}

export function ResponsiveContainer({ 
  children, 
  maxWidth = 'max-w-7xl',
  className 
}: ResponsiveContainerProps) {
  return (
    <div className={cn("mx-auto px-4 sm:px-6 lg:px-8 w-full", maxWidth, className)}>
      {children}
    </div>
  );
}
