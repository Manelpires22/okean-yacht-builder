import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobStop {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useJobStops() {
  return useQuery({
    queryKey: ["job-stops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_stops")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as JobStop[];
    },
  });
}
