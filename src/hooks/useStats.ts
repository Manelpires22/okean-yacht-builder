import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para buscar estatísticas do dashboard administrativo
 * 
 * @description
 * Usa a view otimizada `admin_dashboard_stats` que agrega contagens de:
 * - Modelos de iates ativos
 * - Categorias de memorial
 * - Opcionais disponíveis
 * - Cotações no sistema
 * - Usuários cadastrados
 * - Contratos ativos
 * 
 * **Cache configurado:** 30 segundos (staleTime)
 * 
 * @returns {UseQueryResult} Query result do React Query
 * @returns {Object} return.data - Estatísticas
 * @returns {number} return.data.modelsCount - Total de modelos
 * @returns {number} return.data.categoriesCount - Total de categorias
 * @returns {number} return.data.optionsCount - Total de opcionais
 * @returns {number} return.data.quotationsCount - Total de cotações
 * @returns {number} return.data.usersCount - Total de usuários
 * @returns {number} return.data.contractsCount - Total de contratos
 * 
 * @example
 * ```typescript
 * function AdminDashboard() {
 *   const { data: stats, isLoading } = useStats();
 *   
 *   if (isLoading) return <LoadingSkeleton />;
 *   
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       <StatCard 
 *         title="Modelos" 
 *         value={stats.modelsCount} 
 *         icon={<Yacht />}
 *       />
 *       <StatCard 
 *         title="Cotações" 
 *         value={stats.quotationsCount}
 *         icon={<FileText />}
 *       />
 *       <StatCard 
 *         title="Contratos" 
 *         value={stats.contractsCount}
 *         icon={<FileCheck />}
 *       />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link useContractStats} - Para estatísticas detalhadas de contratos
 */
export const useStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      
      return {
        modelsCount: data?.models_count || 0,
        categoriesCount: data?.categories_count || 0,
        optionsCount: data?.options_count || 0,
        quotationsCount: data?.quotations_count || 0,
        usersCount: data?.users_count || 0,
        contractsCount: data?.contracts_count || 0
      };
    },
    staleTime: 30000, // Cache por 30 segundos
  });
};
