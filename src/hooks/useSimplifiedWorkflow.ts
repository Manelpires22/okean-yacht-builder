import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para verificar se o workflow simplificado está ativo
 * Lê a flag 'use_simplified_workflow' da tabela workflow_config
 */
export function useSimplifiedWorkflow() {
  return useQuery({
    queryKey: ['simplified-workflow-flag'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_config')
        .select('config_value')
        .eq('config_key', 'use_simplified_workflow')
        .maybeSingle();

      if (error) throw error;

      // Por padrão, usar o workflow antigo (false) se não houver configuração
      if (!data || !data.config_value) return false;
      
      const config = data.config_value as { enabled?: boolean };
      return config.enabled === true;
    },
    // Cache por 5 minutos
    staleTime: 5 * 60 * 1000,
  });
}
