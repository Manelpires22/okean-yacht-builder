import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Database, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSeedData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      // Delete in correct order to respect foreign keys
      const errors = [];
      
      try {
        // 1. Delete quotation_options first
        const { error: qoError } = await supabase
          .from('quotation_options' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (qoError) errors.push(`quotation_options: ${qoError.message}`);

        // 2. Delete quotations
        const { error: qError } = await supabase
          .from('quotations' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (qError) errors.push(`quotations: ${qError.message}`);

        // 3. Delete options
        const { error: optError } = await supabase
          .from('options' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (optError) errors.push(`options: ${optError.message}`);

        // 4. Delete option_categories
        const { error: ocError } = await supabase
          .from('option_categories' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (ocError) errors.push(`option_categories: ${ocError.message}`);

        // 5. Delete yacht_models
        const { error: ymError } = await supabase
          .from('yacht_models' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (ymError) errors.push(`yacht_models: ${ymError.message}`);

        // 6. Delete user_roles
        const { error: urError } = await supabase
          .from('user_roles' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (urError) errors.push(`user_roles: ${urError.message}`);

        // 7. Delete users
        const { error: uError } = await supabase
          .from('users' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (uError) errors.push(`users: ${uError.message}`);

        // 8. Delete seed_control
        const { error: scError } = await supabase
          .from('seed_control' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (scError) errors.push(`seed_control: ${scError.message}`);

        if (errors.length > 0) {
          throw new Error(`Erros ao deletar: ${errors.join('; ')}`);
        }

        return { success: true };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Todos os dados removidos",
        description: "TODOS os dados foram removidos permanentemente"
      });
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
              seedStats?.map(({ entity, count }) => (
                <div key={entity} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <label
                      htmlFor={entity}
                      className="text-sm font-medium leading-none cursor-default"
                    >
                      {entityLabels[entity]}
                    </label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{count}</span> registros
                  </div>
                </div>
              ))
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
                <Alert variant="destructive" className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>⚠️ ATENÇÃO - PERIGO</AlertTitle>
                  <AlertDescription>
                    Este botão apaga TODOS os dados do sistema permanentemente.
                    Esta ação não pode ser desfeita!
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleEmergencyDeleteAll}
                  disabled={deleteAllMutation.isPending}
                  variant="destructive"
                  className="w-full bg-red-900 hover:bg-red-800 dark:bg-red-950 dark:hover:bg-red-900"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAllMutation.isPending ? "A apagar..." : "🚨 APAGAR TODOS OS DADOS 🚨"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSeedData;
