import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConvertCustomizationParams {
  customizationId: string;
  contractId: string;
}

export function useConvertCustomizationToATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customizationId, contractId }: ConvertCustomizationParams) => {
      const { data, error } = await supabase.functions.invoke(
        "convert-customization-to-ato",
        {
          body: {
            customization_id: customizationId,
            contract_id: contractId,
          },
        }
      );

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["additional-to-orders"] });
      queryClient.invalidateQueries({ queryKey: ["quotation-customizations"] });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      queryClient.invalidateQueries({ queryKey: ["live-contract"] });
      
      toast.success(`ATO ${data.ato.ato_number} criado com sucesso!`, {
        description: "A customização foi convertida em um ATO no contrato."
      });
    },
    onError: (error: Error) => {
      console.error("Error converting customization to ATO:", error);
      toast.error("Erro ao converter customização", {
        description: error.message
      });
    },
  });
}
