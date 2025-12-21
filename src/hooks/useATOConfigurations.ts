import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ATOConfigurationItemType = 
  | "option" 
  | "memorial_item" 
  | "upgrade" 
  | "ato_item" 
  | "free_customization" 
  | "definable_item";

export interface ATOConfiguration {
  id: string;
  ato_id: string;
  item_id: string | null;
  item_type: ATOConfigurationItemType;
  configuration_details: {
    item_name?: string;
    description?: string;
    quantity?: number;
    type?: string;
    [key: string]: any;
  };
  sub_items: any[];
  notes: string | null;
  original_price: number | null;
  discount_percentage: number | null;
  created_at: string;
  created_by: string | null;
  // Campos de aprovação individual pelo PM
  pm_status: 'pending' | 'approved' | 'rejected' | null;
  pm_notes: string | null;
  pm_reviewed_by: string | null;
  pm_reviewed_at: string | null;
  delivery_impact_days: number | null;
  // Campos para customizações
  materials: any[] | null;
  labor_hours: number | null;
  labor_cost_per_hour: number | null;
  calculated_price: number | null;
}

export interface UpgradeOrigin {
  memorial_item_name: string | null;
  category_label: string | null;
}

export interface ATOConfigurationWithOrigin extends ATOConfiguration {
  upgrade_origin?: UpgradeOrigin | null;
}

export function useATOConfigurations(atoId: string | undefined) {
  return useQuery({
    queryKey: ["ato-configurations", atoId],
    queryFn: async () => {
      if (!atoId) throw new Error("ATO ID is required");

      const { data, error } = await supabase
        .from("ato_configurations")
        .select("*")
        .eq("ato_id", atoId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Enriquecer upgrades com dados de origem
      const enrichedData = await Promise.all(
        (data as ATOConfiguration[]).map(async (config) => {
          if (config.item_type === "upgrade" && config.item_id) {
            // Buscar dados do upgrade e do memorial_item original
            const { data: upgradeData } = await supabase
              .from("memorial_upgrades")
              .select(`
                memorial_item:memorial_items!memorial_item_id(
                  item_name,
                  category:memorial_categories!category_id(label)
                )
              `)
              .eq("id", config.item_id)
              .single();

            if (upgradeData?.memorial_item) {
              const memorialItem = upgradeData.memorial_item as any;
              return {
                ...config,
                upgrade_origin: {
                  memorial_item_name: memorialItem.item_name,
                  category_label: memorialItem.category?.label || null,
                },
              } as ATOConfigurationWithOrigin;
            }
          }
          return config as ATOConfigurationWithOrigin;
        })
      );

      return enrichedData;
    },
    enabled: !!atoId,
  });
}

export function useAddATOConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ato_id: string;
      item_id: string;
      item_type: "option" | "memorial_item";
      configuration_details?: any;
      sub_items?: any[];
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("ato_configurations")
        .insert({
          ato_id: data.ato_id,
          item_id: data.item_id,
          item_type: data.item_type,
          configuration_details: data.configuration_details || {},
          sub_items: data.sub_items || [],
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ato-configurations", variables.ato_id] });
      toast.success("Item adicionado à ATO com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error adding ATO configuration:", error);
      toast.error("Erro ao adicionar item à ATO");
    },
  });
}

export function useRemoveATOConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ configId, atoId }: { configId: string; atoId: string }) => {
      const { error } = await supabase
        .from("ato_configurations")
        .delete()
        .eq("id", configId);

      if (error) throw error;
      return { configId, atoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ato-configurations", data.atoId] });
      toast.success("Item removido da ATO");
    },
    onError: (error: Error) => {
      console.error("Error removing ATO configuration:", error);
      toast.error("Erro ao remover item da ATO");
    },
  });
}
