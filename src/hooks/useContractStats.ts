import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  totalRevenue: number;
  averageContractValue: number;
  totalATOs: number;
  pendingATOs: number;
  approvedATOs: number;
  rejectedATOs: number;
  totalATORevenue: number;
  averageDeliveryDays: number;
}

export function useContractStats() {
  return useQuery({
    queryKey: ["contract-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_stats')
        .select('*')
        .single();

      if (error) throw error;

      const stats: ContractStats = {
        totalContracts: data?.total_contracts || 0,
        activeContracts: data?.active_contracts || 0,
        completedContracts: data?.completed_contracts || 0,
        cancelledContracts: data?.cancelled_contracts || 0,
        totalRevenue: data?.total_revenue || 0,
        averageContractValue: data?.total_contracts > 0 
          ? data.total_revenue / data.total_contracts : 0,
        totalATOs: data?.total_atos || 0,
        pendingATOs: data?.pending_atos || 0,
        approvedATOs: data?.approved_atos || 0,
        rejectedATOs: data?.rejected_atos || 0,
        totalATORevenue: data?.total_ato_revenue || 0,
        averageDeliveryDays: data?.avg_delivery_days || 0,
      };

      return stats;
    },
    staleTime: 30000, // Cache por 30 segundos
  });
}
