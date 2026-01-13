import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Plus, Trash2, Pencil, ArrowUpCircle, Eye, AlertTriangle, Loader2, Search, Package } from "lucide-react";
import { 
  useMemorialUpgrades, 
  useCreateMemorialUpgrade,
  useUpdateMemorialUpgrade,
  useDeleteMemorialUpgrade,
  MemorialUpgrade
} from "@/hooks/useMemorialUpgrades";
import { UpgradeDialog } from "./UpgradeDialog";
import { ExportUpgradesButton } from "./ExportUpgradesButton";
import { ImportUpgradesDialog } from "./ImportUpgradesDialog";
import { formatCurrency } from "@/lib/quotation-utils";

interface YachtModelUpgradesTabProps {
  yachtModelId: string;
}

export function YachtModelUpgradesTab({ yachtModelId }: YachtModelUpgradesTabProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUpgrade, setEditingUpgrade] = useState<any | null>(null);
  const [deletingUpgradeId, setDeletingUpgradeId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: upgrades, isLoading } = useMemorialUpgrades(yachtModelId);
  
  // Delete all upgrades mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('memorial_upgrades')
        .delete()
        .eq('yacht_model_id', yachtModelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorial-upgrades'] });
      queryClient.invalidateQueries({ queryKey: ['upgrades-by-memorial-item'] });
      toast.success('Todos os upgrades foram apagados com sucesso!');
      setShowDeleteAllDialog(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao apagar upgrades: ' + error.message);
    },
  });
  
  // Fetch yacht model code for export filename
  const { data: yachtModel } = useQuery({
    queryKey: ['yacht-model-code', yachtModelId],
    queryFn: async () => {
      const { data } = await supabase
        .from('yacht_models')
        .select('code')
        .eq('id', yachtModelId)
        .single();
      return data;
    },
  });

  // Fetch memorial items for import linking
  const { data: memorialItems } = useQuery({
    queryKey: ['memorial-items-simple', yachtModelId],
    queryFn: async () => {
      const { data } = await supabase
        .from('memorial_items')
        .select('id, item_name')
        .eq('yacht_model_id', yachtModelId)
        .eq('is_active', true);
      return data || [];
    },
  });
  
  const createMutation = useCreateMemorialUpgrade();
  const updateMutation = useUpdateMemorialUpgrade();
  const deleteMutation = useDeleteMemorialUpgrade();

  // Filter upgrades based on showInactive toggle and search
  const filteredUpgrades = useMemo(() => {
    if (!upgrades) return [];
    let filtered = showInactive ? upgrades : upgrades.filter(u => u.is_active);
    
    // Apply search filter (only if >= 3 characters)
    if (debouncedSearch.length >= 3) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(upgrade =>
        upgrade.name?.toLowerCase().includes(searchLower) ||
        upgrade.code?.toLowerCase().includes(searchLower) ||
        upgrade.brand?.toLowerCase().includes(searchLower) ||
        upgrade.model?.toLowerCase().includes(searchLower) ||
        upgrade.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [upgrades, showInactive, debouncedSearch]);

  // Count pending upgrades (without memorial_item)
  const pendingUpgrades = useMemo(() => {
    return filteredUpgrades.filter(u => !u.memorial_item_id);
  }, [filteredUpgrades]);

  // Group upgrades by category (from memorial_item.category)
  const upgradesByCategory = useMemo(() => {
    const grouped: Record<string, {
      category: { id: string; label: string; display_order: number };
      upgrades: MemorialUpgrade[];
    }> = {};

    // Primeiro, adicionar categoria especial para upgrades pendentes
    if (pendingUpgrades.length > 0) {
      grouped['⚠️ Pendentes de Vínculo'] = {
        category: { id: 'pending', label: '⚠️ Pendentes de Vínculo', display_order: -1 },
        upgrades: pendingUpgrades
      };
    }
    
    // Depois, agrupar os outros por categoria
    filteredUpgrades?.forEach(upgrade => {
      // Pular upgrades pendentes (já foram agrupados acima)
      if (!upgrade.memorial_item_id) return;
      
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
  }, [filteredUpgrades, pendingUpgrades]);

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
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar upgrades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            {searchTerm.length > 0 && searchTerm.length < 3 && (
              <span className="text-xs text-muted-foreground">
                Digite ao menos 3 caracteres
              </span>
            )}
            <div className="flex items-center gap-2 mr-2">
              <Switch
                id="show-inactive-upgrades"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive-upgrades" className="text-sm cursor-pointer">
                Mostrar inativos
              </Label>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={!upgrades?.length}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Apagar Upgrades ({upgrades?.length || 0})</TooltipContent>
            </Tooltip>
            <ExportUpgradesButton 
              upgrades={upgrades || []} 
              modelCode={yachtModel?.code || 'MODELO'} 
            />
            <ImportUpgradesDialog 
              yachtModelId={yachtModelId} 
              memorialItems={memorialItems || []} 
            />
            <Button size="sm" onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Upgrade
            </Button>
          </div>
        </div>

        {/* Alert para upgrades pendentes */}
        {pendingUpgrades.length > 0 && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>{pendingUpgrades.length} upgrades</strong> estão pendentes de vinculação ao memorial. 
                Eles não aparecerão no configurador até serem vinculados.
              </span>
            </AlertDescription>
          </Alert>
        )}

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
                            <TableHead className="w-14">Imagem</TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Marca/Modelo</TableHead>
                            <TableHead className="text-right">Custo Delta</TableHead>
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
                              <TableCell>
                                {upgrade.image_url ? (
                                  <img 
                                    src={upgrade.image_url} 
                                    alt={upgrade.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </TableCell>
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
                              <TableCell className={cn(
                                "text-right font-medium",
                                upgrade.price < 0 ? "text-blue-600" : "text-success"
                              )}>
                                {upgrade.price >= 0 ? "+" : ""}{formatCurrency(upgrade.price)}
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
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Pendente
                                  </Badge>
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

      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Apagar todos os Upgrades?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover <strong>{upgrades?.length || 0} upgrades</strong> deste 
              modelo de iate. Esta ação <strong>não pode ser desfeita</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Apagar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
