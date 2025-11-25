import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook para contar tarefas de workflow pendentes do usuário
 * (Customizações + ATOs)
 */
export function useWorkflowPendingCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workflow-pending-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Contar customizações pendentes
      const { count: customizationCount, error: customizationError } = await supabase
        .from('customization_workflow_steps')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'pending');

      if (customizationError) throw customizationError;

      // Contar ATOs pendentes
      const { count: atoCount, error: atoError } = await supabase
        .from('ato_workflow_steps')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'pending');

      if (atoError) throw atoError;

      return (customizationCount || 0) + (atoCount || 0);
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });
}
