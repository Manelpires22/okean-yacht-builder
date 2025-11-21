# Workflow Simplificado de Aprovações - Feature Toggle

## Visão Geral

Este sistema permite a convivência temporária de dois fluxos de aprovação:

### Fluxo Antigo (Complexo)
- **4 etapas sequenciais**: PM Initial → Supply Quote → Planning Check → PM Final
- **Múltiplos atores**: Vendedor, PM, Comprador, Planejador
- **SLA acumulado**: 10+ dias
- **Tabelas**: `customization_workflow_steps`, `workflow_config`, `quotation_customizations`, `approvals`
- **Edge Function**: `advance-customization-workflow`

### Fluxo Novo (Simplificado)
- **1 etapa direta**: Vendedor → PM
- **2 atores**: Vendedor + PM de Engenharia
- **SLA reduzido**: 2-3 dias
- **Tabelas**: `quotation_customizations` (simplificada), `approvals`
- **Lógica**: Direta no frontend + queries simples

## Como Ativar/Desativar

### ✅ Ativar Workflow Simplificado

Execute no SQL Editor do Supabase:

```sql
-- Inserir ou atualizar a flag para ativar o workflow simplificado
INSERT INTO workflow_config (config_key, config_value)
VALUES (
  'use_simplified_workflow',
  '{"enabled": true}'::jsonb
)
ON CONFLICT (config_key) 
DO UPDATE SET 
  config_value = '{"enabled": true}'::jsonb,
  updated_at = now();
```

### ❌ Desativar Workflow Simplificado (voltar ao antigo)

```sql
-- Desativar o workflow simplificado
UPDATE workflow_config
SET 
  config_value = '{"enabled": false}'::jsonb,
  updated_at = now()
WHERE config_key = 'use_simplified_workflow';
```

### 🔍 Verificar Status Atual

```sql
-- Consultar se o workflow simplificado está ativo
SELECT 
  config_key,
  config_value,
  updated_at
FROM workflow_config
WHERE config_key = 'use_simplified_workflow';

-- Se não retornar nenhuma linha, o sistema está usando o workflow ANTIGO por padrão
```

## Comportamento do Sistema

### Com Flag ATIVA (`enabled: true`)

**Para Aprovações Técnicas (Customizações):**
- ✅ Usa `SimplifiedTechnicalApprovalDialog`
- ✅ PM aprova/rejeita direto com custo e prazo
- ✅ Atualiza `quotation_customizations` e `approvals` diretamente
- ✅ Recalcula totais da cotação automaticamente
- ❌ **NÃO** usa workflow de múltiplas etapas
- ❌ **NÃO** cria `customization_workflow_steps`

**Para Aprovações de Desconto (Comerciais):**
- ✅ Mantém comportamento normal com `ApprovalDialog`
- ✅ Diretor Comercial ou Admin aprovam conforme limites

### Com Flag INATIVA ou AUSENTE (`enabled: false` ou sem registro)

**Para TODAS as Aprovações:**
- ✅ Usa o sistema antigo completo
- ✅ Workflow de 4 etapas para customizações
- ✅ `CustomizationWorkflowModal` disponível
- ✅ Edge function `advance-customization-workflow` ativa

## Arquivos Modificados

### Novos Arquivos Criados
- ✅ `src/hooks/useSimplifiedWorkflow.ts` - Hook para ler a flag
- ✅ `src/components/approvals/SimplifiedTechnicalApprovalDialog.tsx` - Diálogo simplificado

### Arquivos Modificados
- ✅ `src/pages/Approvals.tsx` - Lógica condicional de exibição

### Arquivos NÃO Modificados (mantidos para fallback)
- ✅ `src/hooks/useCustomizationWorkflow.ts`
- ✅ `src/components/configurator/CustomizationWorkflowModal.tsx`
- ✅ `supabase/functions/advance-customization-workflow/index.ts`
- ✅ Tabela `customization_workflow_steps`
- ✅ Tabela `workflow_config`

## Plano de Migração Completa (Fase 2)

⚠️ **Não executar ainda! Esta é a FASE 2, após validação do novo fluxo.**

Quando o workflow simplificado estiver validado e quiser remover o antigo:

### 1. Migrar Aprovações Pendentes

```sql
-- Migrar customizações com workflow pendente para status simples
UPDATE quotation_customizations
SET 
  status = CASE 
    WHEN workflow_status IN ('approved', 'completed') THEN 'approved'
    WHEN workflow_status = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END,
  workflow_status = NULL
WHERE workflow_status IS NOT NULL;

-- Atualizar approvals pendentes
UPDATE approvals
SET notes = 'Migrado automaticamente do workflow antigo'
WHERE approval_type = 'technical' 
  AND status = 'pending'
  AND created_at < now();
```

### 2. Remover Tabelas Antigas

```sql
-- ⚠️ IRREVERSÍVEL - Fazer backup antes!
DROP TABLE IF EXISTS customization_workflow_steps CASCADE;

-- Limpar config do workflow antigo
DELETE FROM workflow_config 
WHERE config_key IN (
  'engineering_rate',
  'contingency_percent',
  'sla_days'
);
```

### 3. Remover Colunas da `quotation_customizations`

```sql
-- Remover colunas de workflow complexo
ALTER TABLE quotation_customizations 
  DROP COLUMN IF EXISTS workflow_status,
  DROP COLUMN IF EXISTS workflow_audit,
  DROP COLUMN IF EXISTS pm_scope,
  DROP COLUMN IF EXISTS engineering_hours,
  DROP COLUMN IF EXISTS required_parts,
  DROP COLUMN IF EXISTS supply_items,
  DROP COLUMN IF EXISTS supply_cost,
  DROP COLUMN IF EXISTS supply_lead_time_days,
  DROP COLUMN IF EXISTS supply_notes,
  DROP COLUMN IF EXISTS planning_window_start,
  DROP COLUMN IF EXISTS planning_delivery_impact_days,
  DROP COLUMN IF EXISTS planning_notes,
  DROP COLUMN IF EXISTS pm_final_price,
  DROP COLUMN IF EXISTS pm_final_delivery_impact_days,
  DROP COLUMN IF EXISTS pm_final_notes;
```

### 4. Remover Edge Function

```bash
# Deletar função do Supabase
supabase functions delete advance-customization-workflow
```

### 5. Remover Componentes Frontend (Fase 3)

Deletar os seguintes arquivos:
- `src/components/configurator/workflow/PMInitialForm.tsx`
- `src/components/configurator/workflow/SupplyQuoteForm.tsx`
- `src/components/configurator/workflow/PlanningValidationForm.tsx`
- `src/components/configurator/workflow/PMFinalForm.tsx`
- `src/components/configurator/workflow/WorkflowTimeline.tsx`
- `src/components/configurator/workflow/WorkflowDecisionPanel.tsx`
- `src/components/configurator/workflow/CustomizationContextView.tsx`
- `src/components/configurator/CustomizationWorkflowModal.tsx`
- `src/hooks/useCustomizationWorkflow.ts`
- `src/hooks/useWorkflowPendingCount.ts`
- `src/pages/WorkflowTasks.tsx`
- `src/pages/AdminWorkflowSettings.tsx`

## Testes Recomendados

### Cenário 1: Flag Ativa
1. ✅ Criar cotação com customização
2. ✅ Verificar que approval é criada
3. ✅ PM abre approval e vê `SimplifiedTechnicalApprovalDialog`
4. ✅ PM aprova com custo e prazo
5. ✅ Customização vai para status "approved"
6. ✅ Totais da cotação são atualizados

### Cenário 2: Flag Inativa
1. ✅ Criar cotação com customização
2. ✅ Verificar que workflow de 4 etapas é criado
3. ✅ PM vê `CustomizationWorkflowModal` com etapas
4. ✅ Workflow avança pelas 4 etapas normalmente

### Cenário 3: Coexistência
1. ✅ Ter aprovações criadas no fluxo antigo (flag inativa)
2. ✅ Ativar flag
3. ✅ Novas aprovações usam fluxo simplificado
4. ✅ Aprovações antigas ainda acessíveis via workflow antigo

## Benefícios

### Velocidade
- ⚡ Redução de 10+ dias para 2-3 dias
- ⚡ Menos handoffs = menos espera

### Simplicidade
- 🎯 80% menos código
- 🎯 Apenas 2 atores envolvidos
- 🎯 UI mais direta e clara

### Manutenibilidade
- 🛠️ Menos tabelas para gerenciar
- 🛠️ Menos edge functions
- 🛠️ Debugging mais simples

## Suporte

Em caso de problemas:
1. Verificar flag com query de status
2. Checar logs da aplicação
3. Reverter para workflow antigo se necessário
4. Reportar issue com detalhes

---

**Versão:** 1.0  
**Data:** 2025-01-21  
**Status:** Feature Toggle Ativo (Fase 1 Completa)
