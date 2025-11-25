import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { CustomizationWorkflowModal } from "@/components/configurator/CustomizationWorkflowModal";
import { ATOWorkflowModal } from "@/components/contracts/ATOWorkflowModal";

export default function WorkflowTasks() {
  const { user } = useAuth();
  const { data: userRoles } = useUserRole();
  const [selectedCustomizationId, setSelectedCustomizationId] = useState<string | null>(null);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);

  const roles = (userRoles as any)?.roles || [];
  const isPM = roles.includes('pm_engenharia');
  const isBuyer = roles.includes('comprador');
  const isPlanner = roles.includes('planejador');

  // Buscar tarefas pendentes do usuário (Customizações)
  const { data: myCustomizationTasks, isLoading: loadingCustomizations } = useQuery({
    queryKey: ['workflow-my-customization-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('customization_workflow_steps')
        .select(`
          id,
          step_type,
          status,
          created_at,
          customization:quotation_customizations (
            id,
            item_name,
            notes,
            workflow_status,
            quotation:quotations (
              quotation_number,
              client_name
            )
          )
        `)
        .eq('assigned_to', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Buscar tarefas pendentes do usuário (ATOs)
  const { data: myATOTasks, isLoading: loadingATOs } = useQuery({
    queryKey: ['workflow-my-ato-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('ato_workflow_steps')
        .select(`
          id,
          step_type,
          status,
          created_at,
          ato:additional_to_orders (
            id,
            ato_number,
            title,
            description,
            workflow_status,
            contract:contracts (
              contract_number,
              client:clients (
                name
              )
            )
          )
        `)
        .eq('assigned_to', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = loadingCustomizations || loadingATOs;
  const myTasks = [...(myCustomizationTasks || []), ...(myATOTasks || [])];

  // Buscar todas as tarefas do departamento (se for PM, Supply ou Planejamento)
  const { data: departmentCustomizationTasks } = useQuery({
    queryKey: ['workflow-department-customization-tasks', roles],
    queryFn: async () => {
      if (!roles.length) return [];

      let stepTypes: string[] = [];
      if (isPM) stepTypes.push('pm_initial', 'pm_final');
      if (isBuyer) stepTypes.push('supply_quote');
      if (isPlanner) stepTypes.push('planning_check');

      if (!stepTypes.length) return [];

      const { data, error } = await supabase
        .from('customization_workflow_steps')
        .select(`
          id,
          step_type,
          status,
          assigned_to,
          created_at,
          assigned_user:users (full_name, email),
          customization:quotation_customizations (
            id,
            item_name,
            workflow_status,
            quotation:quotations (
              quotation_number,
              client_name
            )
          )
        `)
        .in('step_type', stepTypes)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: roles.length > 0,
  });

  const { data: departmentATOTasks } = useQuery({
    queryKey: ['workflow-department-ato-tasks', roles],
    queryFn: async () => {
      if (!roles.length) return [];

      let stepTypes: string[] = [];
      if (isPM) stepTypes.push('pm_review', 'pm_final');
      if (isBuyer) stepTypes.push('supply_quote');
      if (isPlanner) stepTypes.push('planning_validation');

      if (!stepTypes.length) return [];

      const { data, error } = await supabase
        .from('ato_workflow_steps')
        .select(`
          id,
          step_type,
          status,
          assigned_to,
          created_at,
          assigned_user:users (full_name, email),
          ato:additional_to_orders (
            id,
            ato_number,
            title,
            workflow_status,
            contract:contracts (
              contract_number,
              client:clients (
                name
              )
            )
          )
        `)
        .in('step_type', stepTypes)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: roles.length > 0,
  });

  const departmentTasks = [...(departmentCustomizationTasks || []), ...(departmentATOTasks || [])];

  const [selectedATOId, setSelectedATOId] = useState<string | null>(null);
  const [atoWorkflowModalOpen, setATOWorkflowModalOpen] = useState(false);

  const handleOpenWorkflow = (customizationId: string) => {
    setSelectedCustomizationId(customizationId);
    setWorkflowModalOpen(true);
  };

  const handleOpenATOWorkflow = (atoId: string) => {
    setSelectedATOId(atoId);
    setATOWorkflowModalOpen(true);
  };

  const STEP_LABELS: Record<string, string> = {
    pm_initial: 'PM Inicial',
    pm_review: 'PM Review',
    supply_quote: 'Cotação Supply',
    planning_check: 'Validação Planejamento',
    planning_validation: 'Validação Planning',
    pm_final: 'PM Final',
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Carregando tarefas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Minhas Tarefas de Workflow
          </h1>
          <p className="text-muted-foreground">
            Customizações aguardando sua análise
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTasks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Atribuídas a você
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamento</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentTasks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total do departamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas Hoje</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="my-tasks">
          <TabsList>
            <TabsTrigger value="my-tasks">
              Minhas Tarefas ({myTasks?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="department">
              Departamento ({departmentTasks?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="mt-6">
            {!myTasks || myTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhuma tarefa pendente</p>
                  <p className="text-sm text-muted-foreground">
                    Você está em dia com suas responsabilidades!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myTasks.map((task: any) => {
                  const isATO = !!task.ato;
                  const itemName = isATO ? task.ato?.title : task.customization?.item_name;
                  const reference = isATO 
                    ? `${task.ato?.contract?.contract_number} • ${task.ato?.contract?.client?.name}`
                    : `${task.customization?.quotation?.quotation_number} • ${task.customization?.quotation?.client_name}`;
                  const notes = isATO ? task.ato?.description : task.customization?.notes;
                  
                  return (
                    <Card key={task.id} className="hover:bg-muted/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{itemName}</CardTitle>
                              {isATO && (
                                <Badge variant="outline" className="text-xs">ATO</Badge>
                              )}
                            </div>
                            <CardDescription>{reference}</CardDescription>
                          </div>
                          <Badge variant="secondary">{STEP_LABELS[task.step_type]}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {notes && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{notes}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Atribuída em{' '}
                              {format(new Date(task.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <Button
                              onClick={() => 
                                isATO 
                                  ? handleOpenATOWorkflow(task.ato.id)
                                  : handleOpenWorkflow(task.customization.id)
                              }
                            >
                              Processar Tarefa
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="department" className="mt-6">
            {!departmentTasks || departmentTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhuma tarefa pendente no departamento</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {departmentTasks.map((task: any) => {
                  const isATO = !!task.ato;
                  const itemName = isATO ? task.ato?.title : task.customization?.item_name;
                  const reference = isATO 
                    ? `${task.ato?.contract?.contract_number} • ${task.ato?.contract?.client?.name}`
                    : `${task.customization?.quotation?.quotation_number} • ${task.customization?.quotation?.client_name}`;
                  
                  return (
                    <Card key={task.id} className="hover:bg-muted/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{itemName}</CardTitle>
                              {isATO && (
                                <Badge variant="outline" className="text-xs">ATO</Badge>
                              )}
                            </div>
                            <CardDescription>{reference}</CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary">{STEP_LABELS[task.step_type]}</Badge>
                            {task.assigned_user && (
                              <Badge variant="outline" className="text-xs">
                                {task.assigned_user.full_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Atribuída em{' '}
                            {format(new Date(task.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => 
                              isATO 
                                ? handleOpenATOWorkflow(task.ato.id)
                                : handleOpenWorkflow(task.customization.id)
                            }
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CustomizationWorkflowModal
        customizationId={selectedCustomizationId}
        open={workflowModalOpen}
        onOpenChange={setWorkflowModalOpen}
      />

      <ATOWorkflowModal
        atoId={selectedATOId}
        open={atoWorkflowModalOpen}
        onOpenChange={setATOWorkflowModalOpen}
      />
    </AdminLayout>
  );
}
