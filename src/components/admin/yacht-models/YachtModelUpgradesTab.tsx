import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, ArrowUpCircle, Eye } from "lucide-react";
import { 
  useMemorialUpgrades, 
  useCreateMemorialUpgrade,
  useUpdateMemorialUpgrade,
  useDeleteMemorialUpgrade,
  MemorialUpgrade
} from "@/hooks/useMemorialUpgrades";
import { UpgradeDialog } from "./UpgradeDialog";
import { formatCurrency } from "@/lib/quotation-utils";

interface YachtModelUpgradesTabProps {
  yachtModelId: string;
}

export function YachtModelUpgradesTab({ yachtModelId }: YachtModelUpgradesTabProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUpgrade, setEditingUpgrade] = useState<any | null>(null);
  const [deletingUpgradeId, setDeletingUpgradeId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data: upgrades, isLoading } = useMemorialUpgrades(yachtModelId);
  
  const createMutation = useCreateMemorialUpgrade();
  const updateMutation = useUpdateMemorialUpgrade();
  const deleteMutation = useDeleteMemorialUpgrade();

  // Filter upgrades based on showInactive toggle
  const filteredUpgrades = useMemo(() => {
    if (!upgrades) return [];
    return showInactive ? upgrades : upgrades.filter(u => u.is_active);
  }, [upgrades, showInactive]);

  // Group upgrades by category (from memorial_item.category)
  const upgradesByCategory = useMemo(() => {
    const grouped: Record<string, {
      category: { id: string; label: string; display_order: number };
      upgrades: MemorialUpgrade[];
    }> = {};
    
    filteredUpgrades?.forEach(upgrade => {
      const category = upgrade.memorial_item?.category;
      const categoryLabel = category?.label || 'Outros';
      
      if (!grouped[categoryLabel]) {
        grouped[categoryLabel] = {
          category: category || { id: '', label: 'Outros', display_order: 999 },
          upgrades: []
        };
      }
      grouped[categoryLabel].upgrades.push(upgrade);
    });
    
    // Sort by display_order
    return Object.entries(grouped)
      .sort((a, b) => a[1].category.display_order - b[1].category.display_order);
  }, [filteredUpgrades]);

  // Count active upgrades per category
  const activeCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    upgrades?.forEach(upgrade => {
      const categoryLabel = upgrade.memorial_item?.category?.label || 'Outros';
      if (!counts[categoryLabel]) counts[categoryLabel] = 0;
      if (upgrade.is_active) counts[categoryLabel]++;
    });
    return counts;
  }, [upgrades]);

  // Find first category with upgrades for default open
  const defaultOpenCategory = useMemo(() => {
    if (upgradesByCategory.length === 0) return "";
    return upgradesByCategory[0]?.[0] || "";
  }, [upgradesByCategory]);

  const handleCreateClick = () => {
    setEditingUpgrade(null);
    setCreateDialogOpen(true);
  };

  const handleEditClick = (upgrade: any) => {
    setEditingUpgrade(upgrade);
    setCreateDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      yacht_model_id: yachtModelId,
      job_stop_id: data.job_stop_id || null,
      configurable_sub_items: data.configurable_sub_items 
        ? JSON.parse(data.configurable_sub_items) 
        : [],
    };

    if (editingUpgrade) {
      updateMutation.mutate({ 
        id: editingUpgrade.id, 
        yachtModelId,
        ...payload 
      }, {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setEditingUpgrade(null);
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setCreateDialogOpen(false);
        }
      });
    }
  };

  const handleDelete = () => {
    if (deletingUpgradeId) {
      deleteMutation.mutate({ id: deletingUpgradeId, yachtModelId }, {
        onSuccess: () => setDeletingUpgradeId(null)
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const noUpgrades = filteredUpgrades.length === 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Upgrades do Modelo</h2>
            <p className="text-sm text-muted-foreground">
              Upgrades substituem ou melhoram itens do memorial padrão.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive-upgrades"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive-upgrades" className="text-sm cursor-pointer">
                Mostrar inativos
              </Label>
            </div>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Upgrade
            </Button>
          </div>
        </div>

        {noUpgrades ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ArrowUpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {showInactive ? "Nenhum upgrade cadastrado" : "Nenhum upgrade ativo"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {showInactive 
                ? "Clique no botão acima para criar o primeiro upgrade."
                : "Ative o toggle 'Mostrar inativos' para ver todos os upgrades."}
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible defaultValue={defaultOpenCategory} className="w-full">
            {upgradesByCategory.map(([categoryLabel, { upgrades: categoryUpgrades }]) => {
              const upgradeCount = categoryUpgrades.length;
              const activeCount = activeCountByCategory[categoryLabel] || 0;

              return (
                <AccordionItem key={categoryLabel} value={categoryLabel}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <span>{categoryLabel}</span>
                      <Badge variant="secondary" className="ml-auto mr-2">
                        {showInactive 
                          ? `${activeCount} ativos / ${upgradeCount} total`
                          : `${upgradeCount} ${upgradeCount === 1 ? 'upgrade' : 'upgrades'}`}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Marca/Modelo</TableHead>
                            <TableHead className="text-right">Preço Delta</TableHead>
                            <TableHead className="text-right">Prazo</TableHead>
                            <TableHead>Job Stop</TableHead>
                            <TableHead>Item Vinculado</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryUpgrades.map((upgrade) => (
                            <TableRow key={upgrade.id}>
                              <TableCell className="font-mono text-sm">{upgrade.code}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{upgrade.name}</p>
                                  {upgrade.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {upgrade.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {upgrade.brand || upgrade.model ? (
                                  <span className="text-sm">
                                    {[upgrade.brand, upgrade.model].filter(Boolean).join(' - ')}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium text-success">
                                +{formatCurrency(upgrade.price)}
                              </TableCell>
                              <TableCell className="text-right">
                                {upgrade.delivery_days_impact > 0 ? `+${upgrade.delivery_days_impact} dias` : '—'}
                              </TableCell>
                              <TableCell>
                                {upgrade.job_stop ? (
                                  <Badge variant="outline" className="font-mono">
                                    {upgrade.job_stop.stage}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {upgrade.memorial_item ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-3">
                                      <div className="text-sm">
                                        <p className="text-muted-foreground mb-1">Vinculado ao item:</p>
                                        <p className="font-medium">{upgrade.memorial_item.item_name}</p>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={upgrade.is_active ? "default" : "secondary"}
                                  className={!upgrade.is_active ? "opacity-70" : ""}
                                >
                                  {upgrade.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditClick(upgrade)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingUpgradeId(upgrade.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      <UpgradeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        yachtModelId={yachtModelId}
        initialData={editingUpgrade}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deletingUpgradeId} onOpenChange={(open) => !open && setDeletingUpgradeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este upgrade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
