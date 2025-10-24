import { useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { MemorialOkeanItem } from "@/hooks/useMemorialOkean";

export function useMemorialSearch(
  items: MemorialOkeanItem[],
  searchTerm: string
) {
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch.trim()) return items;

    const lowerSearch = debouncedSearch.toLowerCase();

    return items.filter((item) => {
      return (
        item.descricao_item.toLowerCase().includes(lowerSearch) ||
        item.categoria.toLowerCase().includes(lowerSearch) ||
        item.modelo.toLowerCase().includes(lowerSearch) ||
        item.marca?.toLowerCase().includes(lowerSearch) ||
        item.tipo_item.toLowerCase().includes(lowerSearch)
      );
    });
  }, [items, debouncedSearch]);

  return {
    filteredItems,
    searchTerm: debouncedSearch,
    hasSearch: debouncedSearch.trim().length > 0,
  };
}
