import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Save, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminWorkflowSettings() {
  const queryClient = useQueryClient();
  const [engineeringRate, setEngineeringRate] = useState(150);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [slaDays, setSlaDays] = useState({
    pm_initial: 2,
    supply_quote: 5,
    planning_check: 2,
    pm_final: 1,
  });

  // Buscar configurações atuais
  const { data: config, isLoading } = useQuery({
    queryKey: ['workflow-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_config')
        .select('*');

      if (error) throw error;

      const configMap: Record<string, any> = {};
      data.forEach((item) => {
        configMap[item.config_key] = item.config_value;
      });

      // Atualizar estados com valores atuais
      if (configMap.engineering_rate) {
        setEngineeringRate(configMap.engineering_rate.rate_per_hour);
      }
      if (configMap.contingency_percent) {
        setContingencyPercent(configMap.contingency_percent.percent);
      }
      if (configMap.sla_days) {
        setSlaDays(configMap.sla_days);
      }

      return configMap;
    },
  });

  // Mutation para salvar configurações
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Atualizar todas as configurações
      const updates = [
        {
          config_key: 'engineering_rate',
          config_value: { rate_per_hour: engineeringRate, currency: 'BRL' },
        },
        {
          config_key: 'contingency_percent',
          config_value: { percent: contingencyPercent },
        },
        {
          config_key: 'sla_days',
          config_value: slaDays,
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('workflow_config')
          .update({
            config_value: update.config_value,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('config_key', update.config_key);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-config'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar configurações', {
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações de Workflow
          </h1>
          <p className="text-muted-foreground">
            Configure taxas, prazos e contingências para o workflow de customizações
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Sobre as Configurações</AlertTitle>
          <AlertDescription>
            Estas configurações afetam o cálculo de custos e prazos nas customizações.
            Mudanças aqui impactam apenas novas customizações criadas após a alteração.
          </AlertDescription>
        </Alert>

        {/* Diagrama do Fluxo */}
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Aprovação de Customizações</CardTitle>
            <CardDescription>
              Workflow sequencial entre departamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-6 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`┌─────────────┐
│  Vendedor   │
│   Solicita  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────────────────┐
│ PM Inicial  │────▶│ • Escopo técnico         │
│  (2 dias)   │     │ • Horas engenharia       │
└──────┬──────┘     │ • Peças preliminares     │
       │            └──────────────────────────┘
       ▼
┌─────────────┐     ┌──────────────────────────┐
│   Supply    │────▶│ • Cotação fornecedores   │
│  (5 dias)   │     │ • Custos e lead time     │
└──────┬──────┘     └──────────────────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────────────────┐
│ Planejamento│────▶│ • Janela de inserção     │
│  (2 dias)   │     │ • Impacto no prazo       │
└──────┬──────┘     │ • Capacidade             │
       │            └──────────────────────────┘
       ▼
┌─────────────┐     ┌──────────────────────────┐
│  PM Final   │────▶│ • Preço de venda         │
│  (1 dia)    │     │ • Aprovação final        │
└──────┬──────┘     └──────────────────────────┘
       │
       ▼
┌─────────────┐
│  Aprovado   │──────┐
└─────────────┘      │
                     ▼
              ┌──────────────┐
              │ Se desconto  │
              │ > limite:    │
              │ Aprovação    │
              │ Comercial    │
              └──────────────┘`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Custos */}
        <Card>
          <CardHeader>
            <CardTitle>Cálculo de Custos Técnicos</CardTitle>
            <CardDescription>
              Parâmetros usados para calcular o custo final das customizações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="engineering-rate">Taxa de Hora de Engenharia (R$/h)</Label>
                <Input
                  id="engineering-rate"
                  type="number"
                  min="0"
                  step="10"
                  value={engineeringRate}
                  onChange={(e) => setEngineeringRate(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Valor cobrado por hora de trabalho de engenharia
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contingency">Percentual de Contingência (%)</Label>
                <Input
                  id="contingency"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={contingencyPercent}
                  onChange={(e) => setContingencyPercent(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Margem de segurança adicionada ao custo técnico
                </p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Fórmula de Cálculo:</h4>
              <p className="text-sm font-mono">
                Custo Técnico = (Custo Peças Supply) + (Horas Engenharia × R$ {engineeringRate}/h)
              </p>
              <p className="text-sm font-mono mt-1">
                Custo com Contingência = Custo Técnico × (1 + {contingencyPercent}%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de SLA */}
        <Card>
          <CardHeader>
            <CardTitle>SLA por Etapa (dias úteis)</CardTitle>
            <CardDescription>
              Prazo máximo esperado para cada departamento processar a customização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sla-pm-initial">PM Inicial (análise técnica)</Label>
                <Input
                  id="sla-pm-initial"
                  type="number"
                  min="1"
                  value={slaDays.pm_initial}
                  onChange={(e) => setSlaDays({ ...slaDays, pm_initial: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sla-supply">Supply (cotação fornecedores)</Label>
                <Input
                  id="sla-supply"
                  type="number"
                  min="1"
                  value={slaDays.supply_quote}
                  onChange={(e) => setSlaDays({ ...slaDays, supply_quote: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sla-planning">Planejamento (validação)</Label>
                <Input
                  id="sla-planning"
                  type="number"
                  min="1"
                  value={slaDays.planning_check}
                  onChange={(e) => setSlaDays({ ...slaDays, planning_check: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sla-pm-final">PM Final (aprovação final)</Label>
                <Input
                  id="sla-pm-final"
                  type="number"
                  min="1"
                  value={slaDays.pm_final}
                  onChange={(e) => setSlaDays({ ...slaDays, pm_final: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Os responsáveis são notificados por email quando uma tarefa é atribuída,
                com o prazo baseado nestes valores de SLA.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            size="lg"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
