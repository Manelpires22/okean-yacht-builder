import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook para contar tarefas de workflow pendentes do usuário
 */
export function useWorkflowPendingCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workflow-pending-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from('customization_workflow_steps')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });
}
