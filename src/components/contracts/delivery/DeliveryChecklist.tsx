import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DeliveryChecklistItemComponent } from "./DeliveryChecklistItem";
import { ATOChecklistGroup } from "./ATOChecklistGroup";
import { DeliveryChecklistItem, useRepopulateChecklist } from "@/hooks/useContractDeliveryChecklist";
import { Package, Settings, FileText, ArrowUpCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface DeliveryChecklistProps {
  items: DeliveryChecklistItem[];
  isLoading?: boolean;
  contractId?: string;
}

const ITEM_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  option: {
    label: "Opcionais Contratados",
    icon: Package,
  },
  upgrade: {
    label: "Upgrades do Memorial",
    icon: ArrowUpCircle,
  },
  customization: {
    label: "Customizações",
    icon: Settings,
  },
  memorial_item: {
    label: "Itens de Memorial",
    icon: FileText,
  },
};

// Fallback para tipos não mapeados
const DEFAULT_CONFIG = {
  label: "Outros Itens",
  icon: FileText,
};

export function DeliveryChecklist({ items, isLoading, contractId }: DeliveryChecklistProps) {
  const repopulateMutation = useRepopulateChecklist();

  const handleRepopulate = async () => {
    if (!contractId) return;
    
    try {
      await repopulateMutation.mutateAsync(contractId);
      toast.success("Checklist atualizado com sucesso!");
    } catch (error) {
      console.error("Error repopulating checklist:", error);
      toast.error("Erro ao atualizar checklist");
    }
  };

  // Separar itens normais dos itens de ATO e agrupar por ATO
  const { normalGroupedItems, atoGroups } = useMemo(() => {
    if (!items || items.length === 0) {
      return { normalGroupedItems: {}, atoGroups: {} };
    }

    // Itens normais (não são de ATO nem ato_item que é apenas agrupador)
    const normalItems = items.filter(
      i => i.item_type !== "ato_config_item" && (i.item_type as string) !== "ato_item"
    );

    // Agrupar itens normais por tipo
    const normalGrouped = normalItems.reduce((acc, item) => {
      if (!acc[item.item_type]) {
        acc[item.item_type] = [];
      }
      acc[item.item_type].push(item);
      return acc;
    }, {} as Record<string, DeliveryChecklistItem[]>);

    // Agrupar configurações de ATO pelo prefixo do código (ex: "ATO 1")
    const atoConfigItems = items.filter(i => i.item_type === "ato_config_item");

    const atoGroupsMap: Record<string, {
      atoNumber: string;
      configs: DeliveryChecklistItem[];
    }> = {};

    // Agrupar pelo prefixo do código
    atoConfigItems.forEach(config => {
      // Extrair número da ATO do código (formato: "ATO 1::OPT-001" ou apenas "ATO 1")
      const atoNumber = config.item_code?.split("::")[0] || "ATO";
      
      if (!atoGroupsMap[atoNumber]) {
        atoGroupsMap[atoNumber] = { atoNumber, configs: [] };
      }
      atoGroupsMap[atoNumber].configs.push(config);
    });

    return { normalGroupedItems: normalGrouped, atoGroups: atoGroupsMap };
  }, [items]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Checklist de Entrega</CardTitle>
          {contractId && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRepopulate}
              disabled={repopulateMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${repopulateMutation.isPending ? 'animate-spin' : ''}`} />
              Repopular
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum item encontrado no checklist de entrega.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasNormalItems = Object.keys(normalGroupedItems).length > 0;
  const hasATOs = Object.keys(atoGroups).length > 0;

  return (
    <div className="space-y-6">
      {/* Botão de repopular no topo */}
      {contractId && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRepopulate}
            disabled={repopulateMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${repopulateMutation.isPending ? 'animate-spin' : ''}`} />
            Atualizar Checklist
          </Button>
        </div>
      )}

      {/* Seções de itens normais (Opcionais, Upgrades, Customizações) */}
      {hasNormalItems && Object.entries(normalGroupedItems).map(([type, typeItems]) => {
        const config = ITEM_TYPE_CONFIG[type] || { ...DEFAULT_CONFIG, label: type };
        const Icon = config.icon;
        const verifiedCount = typeItems.filter((item) => item.is_verified).length;

        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {config.label}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {verifiedCount}/{typeItems.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {typeItems.map((item) => (
                <DeliveryChecklistItemComponent key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Seção de ATOs - cada ATO com seus itens agrupados */}
      {hasATOs && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ATOs Aprovadas
          </h3>
          
          {Object.values(atoGroups).map(({ atoNumber, configs }) => (
            <ATOChecklistGroup
              key={atoNumber}
              atoNumber={atoNumber}
              configItems={configs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
