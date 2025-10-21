import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Database, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSeedData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState("");

  // Fetch real counts from actual tables
  const { data: seedStats, isLoading } = useQuery({
    queryKey: ['seed-stats'],
    queryFn: async () => {
      const entities = [
        { type: 'yacht_models', table: 'yacht_models' as any },
        { type: 'option_categories', table: 'option_categories' as any },
        { type: 'options', table: 'options' as any },
        { type: 'users', table: 'users' as any },
        { type: 'quotations', table: 'quotations' as any }
      ];
      
      const counts = await Promise.all(
        entities.map(async ({ type, table }) => {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          return { entity: type, count: count || 0 };
        })
      );
      
      return counts;
    }
  });

  // Fetch seed control data to know which items are seed data
  const { data: seedControlData } = useQuery({
    queryKey: ['seed-control-data'],
    queryFn: async () => {
      const { data } = await supabase
        .from('seed_control' as any)
        .select('entity_type, entity_id');
      return ((data || []) as unknown) as Array<{ entity_type: string; entity_id: string }>;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (entityTypes: string[]) => {
      const { data, error } = await (supabase.rpc as any)('clear_seed_data', {
        entity_types: entityTypes
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Dados removidos",
        description: "Os dados de teste foram removidos com sucesso"
      });
      setSelectedEntities([]);
      setConfirmText("");
      queryClient.invalidateQueries({ queryKey: ['seed-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seed-control-data'] });
      queryClient.invalidateQueries({ queryKey: ['admin-yacht-models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao remover dados: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as any)('clear_all_data');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Todos os dados removidos",
        description: "TODOS os dados foram removidos permanentemente"
      });
      setSelectedEntities([]);
      setConfirmText("");
      queryClient.invalidateQueries({ queryKey: ['seed-stats'] });
      queryClient.invalidateQueries({ queryKey: ['seed-control-data'] });
      queryClient.invalidateQueries({ queryKey: ['admin-yacht-models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao remover dados: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const entityLabels: Record<string, string> = {
    yacht_models: "Modelos de Iates",
    option_categories: "Categorias de Opcionais",
    options: "Opcionais",
    users: "Utilizadores",
    quotations: "Cotações"
  };

  const handleToggle = (entity: string) => {
    setSelectedEntities(prev =>
      prev.includes(entity)
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    );
  };

  const handleDelete = () => {
    if (confirmText !== "CONFIRMAR") {
      toast({
        title: "Confirmação necessária",
        description: "Digite CONFIRMAR para prosseguir",
        variant: "destructive"
      });
      return;
    }
    deleteMutation.mutate(selectedEntities);
  };

  const handleDeleteAll = () => {
    if (confirmText !== "CONFIRMAR") {
      toast({
        title: "Confirmação necessária",
        description: "Digite CONFIRMAR para prosseguir",
        variant: "destructive"
      });
      return;
    }
    const allEntities = seedStats?.map(s => s.entity) || [];
    deleteMutation.mutate(allEntities);
  };

  const handleEmergencyDeleteAll = () => {
    if (confirmText !== "CONFIRMAR") {
      toast({
        title: "Confirmação necessária",
        description: "Digite CONFIRMAR para prosseguir",
        variant: "destructive"
      });
      return;
    }
    deleteAllMutation.mutate();
  };

  // Get count of seed items per entity type
  const getSeedCount = (entityType: string) => {
    return seedControlData?.filter(item => item.entity_type === entityType).length || 0;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Dados de Teste</h1>
          <p className="text-muted-foreground">
            Remover dados de seeding para limpar a base de dados
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Esta ação é irreversível. Certifique-se de que deseja remover os dados selecionados.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dados de Teste Disponíveis
            </CardTitle>
            <CardDescription>
              Selecione os tipos de dados que deseja remover
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))
            ) : (
              seedStats?.map(({ entity, count }) => {
                const seedCount = getSeedCount(entity);
                return (
                  <div key={entity} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={entity}
                        checked={selectedEntities.includes(entity)}
                        onCheckedChange={() => handleToggle(entity)}
                        disabled={seedCount === 0}
                      />
                      <label
                        htmlFor={entity}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {entityLabels[entity]}
                      </label>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">{count}</span> total
                      {seedCount > 0 && (
                        <span className="ml-2 text-orange-600 dark:text-orange-400">
                          ({seedCount} seed)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div className="pt-4 border-t space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Digite "CONFIRMAR" para prosseguir:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border rounded-md"
                  placeholder="CONFIRMAR"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button
                    onClick={handleDelete}
                    disabled={selectedEntities.length === 0 || deleteMutation.isPending}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Apagar Selecionados (Seed)
                  </Button>
                  <Button
                    onClick={handleDeleteAll}
                    disabled={deleteMutation.isPending || !seedControlData?.length}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Apagar Todos os Seeds
                  </Button>
                </div>

                <div className="pt-3 border-t">
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>⚠️ EMERGÊNCIA - PERIGO</AlertTitle>
                    <AlertDescription>
                      Este botão apaga TODOS os dados do sistema, incluindo dados reais (não apenas seed).
                      Use apenas em caso de emergência!
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleEmergencyDeleteAll}
                    disabled={deleteAllMutation.isPending}
                    variant="destructive"
                    className="w-full bg-red-900 hover:bg-red-800 dark:bg-red-950 dark:hover:bg-red-900"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    🚨 LIMPAR TUDO (EMERGÊNCIA) 🚨
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSeedData;
