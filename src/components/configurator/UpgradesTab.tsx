import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowUpCircle, Check } from "lucide-react";
import { useMemorialUpgrades, useMemorialItemsWithUpgrades } from "@/hooks/useMemorialUpgrades";
import { formatCurrency } from "@/lib/quotation-utils";

interface SelectedUpgrade {
  upgrade_id: string;
  memorial_item_id: string;
  name: string;
  price: number;
  delivery_days_impact: number;
}

interface UpgradesTabProps {
  yachtModelId: string;
  selectedUpgrades: SelectedUpgrade[];
  onSelectUpgrade: (upgrade: SelectedUpgrade | null, memorialItemId: string) => void;
}

export function UpgradesTab({
  yachtModelId,
  selectedUpgrades,
  onSelectUpgrade,
}: UpgradesTabProps) {
  const { data: upgrades, isLoading: upgradesLoading } = useMemorialUpgrades(yachtModelId);
  const { data: memorialItems, isLoading: itemsLoading } = useMemorialItemsWithUpgrades(yachtModelId);

  // Filter only active upgrades
  const activeUpgrades = useMemo(() => {
    return upgrades?.filter(u => u.is_active) || [];
  }, [upgrades]);

  // Group upgrades by memorial item
  const upgradesByItem = useMemo(() => {
    const grouped: Record<string, typeof activeUpgrades> = {};
    
    memorialItems?.forEach(item => {
      grouped[item.id] = activeUpgrades.filter(u => u.memorial_item_id === item.id);
    });

    return grouped;
  }, [activeUpgrades, memorialItems]);

  // Get selected upgrade for a memorial item
  const getSelectedUpgradeId = (memorialItemId: string) => {
    const selected = selectedUpgrades.find(u => u.memorial_item_id === memorialItemId);
    return selected?.upgrade_id || 'standard';
  };

  const handleUpgradeChange = (memorialItemId: string, upgradeId: string) => {
    if (upgradeId === 'standard') {
      onSelectUpgrade(null, memorialItemId);
    } else {
      const upgrade = activeUpgrades.find(u => u.id === upgradeId);
      if (upgrade) {
        onSelectUpgrade({
          upgrade_id: upgrade.id,
          memorial_item_id: memorialItemId,
          name: upgrade.name,
          price: upgrade.price,
          delivery_days_impact: upgrade.delivery_days_impact,
        }, memorialItemId);
      }
    }
  };

  if (upgradesLoading || itemsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!memorialItems || memorialItems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 pb-6 text-center">
          <ArrowUpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum upgrade disponível</h3>
          <p className="text-muted-foreground">
            Este modelo não possui itens com opções de upgrade configuradas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Upgrades Disponíveis</h3>
        <p className="text-sm text-muted-foreground">
          Escolha upgrades para melhorar os itens do memorial padrão. Você pode manter o padrão ou selecionar uma opção superior.
        </p>
      </div>

      <div className="space-y-4">
        {memorialItems.map((item) => {
          const itemUpgrades = upgradesByItem[item.id] || [];
          const selectedValue = getSelectedUpgradeId(item.id);
          const hasSelection = selectedValue !== 'standard';

          if (itemUpgrades.length === 0) return null;

          return (
            <Card key={item.id} className={hasSelection ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {item.item_name}
                      {hasSelection && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Upgrade selecionado
                        </Badge>
                      )}
                    </CardTitle>
                    {item.category && (
                      <CardDescription>{item.category.label}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedValue}
                  onValueChange={(value) => handleUpgradeChange(item.id, value)}
                  className="space-y-3"
                >
                  {/* Standard option */}
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="standard" id={`${item.id}-standard`} />
                    <Label 
                      htmlFor={`${item.id}-standard`} 
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium">Manter padrão</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (incluído no memorial base)
                      </span>
                    </Label>
                  </div>

                  <Separator />

                  {/* Upgrade options */}
                  {itemUpgrades.map((upgrade) => (
                    <div 
                      key={upgrade.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        selectedValue === upgrade.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <RadioGroupItem value={upgrade.id} id={upgrade.id} className="mt-1" />
                      <Label 
                        htmlFor={upgrade.id} 
                        className="flex-1 cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{upgrade.name}</span>
                          <span className={`font-semibold ${
                            upgrade.price > 0 
                              ? 'text-success' 
                              : upgrade.price < 0 
                                ? 'text-blue-600' 
                                : 'text-muted-foreground'
                          }`}>
                            {upgrade.price > 0 && '+'}
                            {upgrade.price !== 0 ? formatCurrency(upgrade.price) : 'Incluso'}
                          </span>
                        </div>
                        {(upgrade.brand || upgrade.model) && (
                          <p className="text-sm text-muted-foreground">
                            {[upgrade.brand, upgrade.model].filter(Boolean).join(' - ')}
                          </p>
                        )}
                        {upgrade.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {upgrade.description}
                          </p>
                        )}
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          {upgrade.delivery_days_impact > 0 && (
                            <span>+{upgrade.delivery_days_impact} dias no prazo</span>
                          )}
                          {upgrade.job_stop && (
                            <Badge variant="outline" className="text-xs">
                              {upgrade.job_stop.stage}
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
