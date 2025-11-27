import { useMemo } from "react";
import { useQuotations } from "./useQuotations";

export function useQuotationsGroupedByVersion() {
  const { data: quotations, isLoading } = useQuotations();

  const groupedQuotations = useMemo(() => {
    if (!quotations || !Array.isArray(quotations)) return [];

    // 1. Criar mapa de todas as cotações por ID
    const quotationsMap = new Map(quotations.map(q => [q.id, q]));
    
    // 2. Função para encontrar a raiz real percorrendo toda a cadeia
    const findRealRoot = (quotation: any): any => {
      let current = quotation;
      const visited = new Set<string>();
      
      while (current.parent_quotation_id && !visited.has(current.id)) {
        visited.add(current.id);
        const parent = quotationsMap.get(current.parent_quotation_id);
        if (!parent) break;
        current = parent;
      }
      
      return current;
    };
    
    // 3. Agrupar todas as cotações pela raiz real
    const groupsByRoot = new Map<string, any[]>();
    
    for (const quotation of quotations) {
      const root = findRealRoot(quotation);
      const rootId = root.id;
      
      if (!groupsByRoot.has(rootId)) {
        groupsByRoot.set(rootId, []);
      }
      groupsByRoot.get(rootId)!.push(quotation);
    }
    
    // 4. Processar cada grupo
    const grouped = Array.from(groupsByRoot.entries()).map(([rootId, versions]) => {
      // Verificar se alguma versão tem contrato
      const contractedVersion = versions.find(v => 
        v.contracts && Array.isArray(v.contracts) && v.contracts.length > 0
      );
      
      // Se tem contrato, essa é a versão principal
      // Senão, a mais recente (maior version number)
      let latestVersion: any;
      let previousVersions: any[];
      
      if (contractedVersion) {
        latestVersion = contractedVersion;
        previousVersions = versions
          .filter(v => v.id !== contractedVersion.id)
          .sort((a, b) => (b.version || 1) - (a.version || 1));
      } else {
        // Ordenar por versão decrescente
        const sorted = [...versions].sort((a, b) => (b.version || 1) - (a.version || 1));
        latestVersion = sorted[0];
        previousVersions = sorted.slice(1);
      }
      
      return {
        rootId,
        latestVersion,
        previousVersions,
        totalVersions: versions.length,
        hasMultipleVersions: versions.length > 1,
        hasContract: !!contractedVersion,
        contractedVersionId: contractedVersion?.id || null,
        contractNumber: contractedVersion?.contracts?.[0]?.contract_number || null,
      };
    });
    
    // 5. Ordenar grupos: contratos primeiro, depois por data de criação
    grouped.sort((a, b) => {
      if (a.hasContract && !b.hasContract) return -1;
      if (!a.hasContract && b.hasContract) return 1;
      return new Date(b.latestVersion.created_at).getTime() - 
             new Date(a.latestVersion.created_at).getTime();
    });

    return grouped;
  }, [quotations]);

  return { data: groupedQuotations, isLoading };
}
