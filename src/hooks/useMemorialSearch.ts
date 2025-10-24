import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import type { MemorialOkeanItem } from "@/hooks/useMemorialOkean";

export function useMemorialSearch(searchTerm: string) {
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Query global independente - busca TODOS os itens do memorial_okean
  const { data: allItems } = useQuery({
    queryKey: ['memorial-okean-search-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_okean')
        .select('*')
        .order('modelo')
        .order('categoria')
        .order('descricao_item');
      
      if (error) throw error;
      return data as MemorialOkeanItem[];
    },
    enabled: debouncedSearch.trim().length > 0, // só busca se tiver texto
  });

  const filteredItems = useMemo(() => {
    if (!debouncedSearch.trim() || !allItems) return [];

    const lowerSearch = debouncedSearch.toLowerCase();

    return allItems.filter((item) => {
      return (
        item.descricao_item.toLowerCase().includes(lowerSearch) ||
        item.categoria.toLowerCase().includes(lowerSearch) ||
        item.modelo.toLowerCase().includes(lowerSearch) ||
        item.marca?.toLowerCase().includes(lowerSearch) ||
        item.tipo_item.toLowerCase().includes(lowerSearch)
      );
    });
  }, [allItems, debouncedSearch]);

  return {
    filteredItems,
    searchTerm: debouncedSearch,
    hasSearch: debouncedSearch.trim().length > 0,
  };
}
