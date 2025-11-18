import { useMemo } from "react";
import { useQuotations } from "./useQuotations";

export function useQuotationsGroupedByVersion() {
  const { data: quotations, isLoading } = useQuotations();

  const groupedQuotations = useMemo(() => {
    if (!quotations || !Array.isArray(quotations)) return [];

    // 1. Criar mapa de todas as cotações por ID
    const quotationsMap = new Map(quotations.map(q => [q.id, q]));
    
    // 2. Encontrar cotações raiz (sem parent_quotation_id)
    const rootQuotations = quotations.filter(q => !q.parent_quotation_id);
    
    // 3. Para cada raiz, construir a árvore de versões
    const grouped = rootQuotations.map(root => {
      // Buscar todas as versões que pertencem a esta raiz
      const versions = quotations.filter(q => 
        q.id === root.id || q.parent_quotation_id === root.id
      );
      
      // Ordenar por versão (decrescente - mais recente primeiro)
      versions.sort((a, b) => (b.version || 1) - (a.version || 1));
      
      const latestVersion = versions[0];
      const previousVersions = versions.slice(1);
      
      return {
        rootId: root.id,
        latestVersion,
        previousVersions,
        totalVersions: versions.length,
        hasMultipleVersions: versions.length > 1
      };
    });

    // 4. Incluir cotações órfãs (não são raiz e não tem raiz encontrada)
    const allVersionIds = new Set<string>();
    grouped.forEach(g => {
      if (g.latestVersion) {
        allVersionIds.add(g.latestVersion.id);
      }
      if (Array.isArray(g.previousVersions)) {
        g.previousVersions.forEach(v => allVersionIds.add(v.id));
      }
    });
    
    const orphans = quotations
      .filter(q => !allVersionIds.has(q.id))
      .map(q => ({
        rootId: q.id,
        latestVersion: q,
        previousVersions: [],
        totalVersions: 1,
        hasMultipleVersions: false
      }));

    return [...grouped, ...orphans];
  }, [quotations]);

  return { data: groupedQuotations, isLoading };
}
