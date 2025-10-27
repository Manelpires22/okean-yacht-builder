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
      // Fetch all contracts
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("status, current_total_price, current_total_delivery_days");

      if (contractsError) throw contractsError;

      // Fetch all ATOs
      const { data: atos, error: atosError } = await supabase
        .from("additional_to_orders")
        .select("status, price_impact");

      if (atosError) throw atosError;

      // Calculate contract stats
      const totalContracts = contracts?.length || 0;
      const activeContracts = contracts?.filter(c => c.status === "active").length || 0;
      const completedContracts = contracts?.filter(c => c.status === "completed").length || 0;
      const cancelledContracts = contracts?.filter(c => c.status === "cancelled").length || 0;

      const totalRevenue = contracts?.reduce((sum, c) => sum + Number(c.current_total_price), 0) || 0;
      const averageContractValue = totalContracts > 0 ? totalRevenue / totalContracts : 0;
      const averageDeliveryDays = totalContracts > 0
        ? contracts.reduce((sum, c) => sum + Number(c.current_total_delivery_days), 0) / totalContracts
        : 0;

      // Calculate ATO stats
      const totalATOs = atos?.length || 0;
      const pendingATOs = atos?.filter(a => a.status === "draft" || a.status === "pending_approval").length || 0;
      const approvedATOs = atos?.filter(a => a.status === "approved").length || 0;
      const rejectedATOs = atos?.filter(a => a.status === "rejected").length || 0;
      const totalATORevenue = atos?.filter(a => a.status === "approved")
        .reduce((sum, a) => sum + Number(a.price_impact), 0) || 0;

      const stats: ContractStats = {
        totalContracts,
        activeContracts,
        completedContracts,
        cancelledContracts,
        totalRevenue,
        averageContractValue,
        totalATOs,
        pendingATOs,
        approvedATOs,
        rejectedATOs,
        totalATORevenue,
        averageDeliveryDays,
      };

      return stats;
    },
  });
}
