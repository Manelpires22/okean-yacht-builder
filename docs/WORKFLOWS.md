# 🔄 Workflows do Sistema - OKEAN Yachts CPQ

Este documento detalha os principais fluxos de negócio do sistema CPQ usando diagramas Mermaid.

## Índice

1. [Workflow de Cotação Completo](#1-workflow-de-cotação-completo)
2. [Estados de Cotação](#2-estados-de-cotação)
3. [Workflow de Limites de Desconto](#3-workflow-de-limites-de-desconto)
4. [Workflow de Customizações - Simplificado](#4-workflow-de-customizações---simplificado)
5. [Workflow de Customizações - Completo (Legacy)](#5-workflow-de-customizações---completo-legacy)
6. [Workflow de ATOs](#6-workflow-de-atos-aditivos-de-contrato)
7. [Estados de ATO](#7-estados-de-ato)
8. [Criação de Contrato](#8-criação-de-contrato)
9. [Conversão Customização → ATO](#9-conversão-customização--ato)
10. [Referência de Status](#10-referência-de-status)

---

## Legenda de Atores

| Ator | Descrição |
|------|-----------|
| **Vendedor** | Usuário com role `comercial` ou `gerente_comercial` |
| **PM Engenharia** | Usuário com role `pm_engenharia` |
| **Diretor Comercial** | Usuário com role `diretor_comercial` |
| **Administrador** | Usuário com role `administrador` |
| **Cliente** | Cliente externo (acesso via link público) |

---

## 1. Workflow de Cotação Completo

Fluxo completo desde a criação até a conversão em contrato.

```mermaid
sequenceDiagram
    actor Vendedor
    participant Config as Configurador
    participant DB as Supabase
    participant PM as PM Engenharia
    participant Dir as Diretor Comercial
    participant Cliente

    Vendedor->>Config: Seleciona modelo (yacht_models)
    Config->>Config: Adiciona opcionais (options)
    Config->>Config: Adiciona customizações (memorial)
    Config->>Config: Calcula preços (hooks/useQuotationPricing)
    Vendedor->>DB: Salva cotação (status: draft)
    
    alt Desconto > 10% Base ou > 8% Opcionais
        DB->>Dir: Notifica para aprovação comercial
        Dir->>DB: Aprova/Rejeita
    end
    
    alt Tem customizações pendentes
        DB->>PM: Notifica para análise técnica
        PM->>DB: Define custo e prazo
    end
    
    Vendedor->>DB: Atualiza status (ready_to_send)
    Vendedor->>Cliente: Envia cotação (email + PDF)
    
    alt Cliente aceita
        Cliente->>DB: Aceita (accepted)
        DB->>DB: Gera contrato (contracts)
    end
    
    alt Prazo expirou
        DB->>DB: Status → expired
    end
```

**Arquivos envolvidos:**
- `src/pages/Configurator.tsx` - Interface do configurador
- `src/hooks/quotations/useQuotationPricing.ts` - Cálculo de preços
- `src/hooks/useSaveQuotation.ts` - Salvamento de cotações
- `src/hooks/useSendQuotation.ts` - Envio ao cliente
- `supabase/functions/send-quotation-email/` - Envio de email

---

## 2. Estados de Cotação

Máquina de estados completa de uma cotação.

```mermaid
stateDiagram-v2
    [*] --> draft: Cotação criada

    draft --> pending_commercial_approval: Desconto > limite
    draft --> pending_technical_approval: Tem customizações
    draft --> ready_to_send: Sem aprovações necessárias

    pending_commercial_approval --> pending_technical_approval: Aprovado + tem customizações
    pending_commercial_approval --> ready_to_send: Aprovado (sem customizações)
    pending_commercial_approval --> rejected: Rejeitado
    pending_commercial_approval --> draft: Revisão solicitada

    pending_technical_approval --> ready_to_send: PM aprovou
    pending_technical_approval --> pending_commercial_approval: Aguarda comercial
    pending_technical_approval --> rejected: Rejeitado
    pending_technical_approval --> draft: Revisão solicitada

    ready_to_send --> sent: Enviada ao cliente
    ready_to_send --> draft: Edição necessária

    sent --> accepted: Cliente aceita
    sent --> expired: Prazo venceu (valid_until)
    sent --> rejected: Cliente recusa

    accepted --> [*]: Contrato gerado

    rejected --> draft: Nova versão
    expired --> draft: Nova versão
```

**Lógica implementada em:**
- `src/lib/quotation-status-utils.ts` - Função `calculateQuotationStatus()`
- `src/hooks/useQuotationStatus.ts` - Hook para calcular status

---

## 3. Workflow de Limites de Desconto

Determina qual nível de aprovação é necessário baseado no desconto aplicado.

```mermaid
flowchart TD
    A[Cotação com Desconto] --> B{Desconto Base > 10%<br/>OU Opcionais > 8%?}
    
    B -->|Não| C[✅ Aprovado Automaticamente]
    B -->|Sim| D{Desconto > Limite Diretor?<br/>Base > 15% ou Opcionais > 12%}
    
    D -->|Não| E[📋 Aguarda Diretor Comercial]
    D -->|Sim| F[📋 Aguarda Administrador]
    
    E --> G{Diretor Aprova?}
    F --> H{Admin Aprova?}
    
    G -->|Sim| I[✅ Comercial Aprovado]
    G -->|Não| J[❌ Rejeitado]
    
    H -->|Sim| I
    H -->|Não| J
    
    I --> K{Tem Customizações?}
    K -->|Sim| L[Aguarda Técnica]
    K -->|Não| M[Ready to Send]
    
    J --> N[Voltar para Draft]
```

**Configuração de limites:**
- Tabela: `discount_limits_config`
- Limites editáveis em: `/admin/discount-settings`

**Arquivos envolvidos:**
- `src/lib/approval-utils.ts` - Funções `getRequiredApproverRole()`, `needsApproval()`
- `src/hooks/useDiscountLimits.ts` - Gerenciamento de limites
- `src/pages/AdminDiscountSettings.tsx` - Interface de configuração

---

## 4. Workflow de Customizações - Simplificado

Sistema simplificado de aprovação de customizações (flag: `use_simplified_workflow`).

```mermaid
stateDiagram-v2
    [*] --> pending: Customização criada

    pending --> pending_pm_review: Cotação submetida

    pending_pm_review --> approved: PM aprova (define custo/prazo)
    pending_pm_review --> rejected: PM rejeita

    approved --> [*]: Incluída no cálculo final
    rejected --> [*]: Removida ou revisada

    note right of pending_pm_review: PM define:\n- Custo adicional\n- Impacto no prazo\n- Notas técnicas
```

**Quando usar:**
- Flag ativa: `workflow_config.use_simplified_workflow = true`
- Aprovação única pelo PM Engenharia
- SLA: 2-3 dias

**Arquivos envolvidos:**
- `src/hooks/useSimplifiedWorkflow.ts` - Verifica flag
- `src/components/approvals/SimplifiedTechnicalApprovalDialog.tsx` - Interface de aprovação
- `src/pages/Approvals.tsx` - Página de aprovações

**Documentação:** [WORKFLOW_SIMPLIFICADO.md](./WORKFLOW_SIMPLIFICADO.md)

---

## 5. Workflow de Customizações - Completo (Legacy)

Sistema completo de 4 etapas (usado quando `use_simplified_workflow = false`).

```mermaid
sequenceDiagram
    actor Vendedor
    participant DB as quotation_customizations
    participant PM1 as PM Initial
    participant Supply as Compras
    participant Plan as Planejamento
    participant PM2 as PM Final

    Vendedor->>DB: Cria customização
    DB->>PM1: Step: pm_initial (2 dias SLA)
    
    PM1->>PM1: Define escopo e horas
    PM1->>DB: Avança workflow (response_data)
    
    DB->>Supply: Step: supply_quote (5 dias SLA)
    Supply->>Supply: Cotação de materiais
    Supply->>DB: Avança workflow (supply_cost, supply_items)
    
    DB->>Plan: Step: planning_check (2 dias SLA)
    Plan->>Plan: Valida janela produção
    Plan->>DB: Avança workflow (planning_window_start)
    
    DB->>PM2: Step: pm_final (1 dia SLA)
    PM2->>PM2: Consolida preço final
    PM2->>DB: Completa workflow (pm_final_price, pm_final_delivery_impact_days)
    
    Note over DB: workflow_status: completed<br/>Custo e prazo definidos
```

**Etapas do workflow:**
1. `pm_initial` - PM define escopo e horas de engenharia
2. `supply_quote` - Compras cotam materiais
3. `planning_check` - Planejamento valida janela de produção
4. `pm_final` - PM consolida custos e prazos finais

**Arquivos envolvidos:**
- `src/hooks/useCustomizationWorkflow.ts` - Gerencia workflow completo
- `src/components/configurator/workflow/` - Componentes de cada etapa
- `supabase/functions/advance-customization-workflow/` - Edge function de avanço

---

## 6. Workflow de ATOs (Aditivos de Contrato)

Fluxo de criação e aprovação de aditivos após contrato assinado.

```mermaid
sequenceDiagram
    actor Vendedor
    participant DB as additional_to_orders
    participant PM as PM Engenharia
    participant Cliente

    Vendedor->>DB: Cria ATO (draft)
    Note over DB: Origem: Nova customização<br/>ou Conversão de customização

    DB->>PM: Notifica para análise
    
    PM->>PM: Analisa viabilidade técnica
    PM->>PM: Define materiais e mão de obra
    PM->>PM: Calcula custo sugerido
    PM->>DB: Submete análise (workflow_status: completed)

    Note over DB: ATO volta para draft<br/>aguardando validação comercial

    Vendedor->>Vendedor: Revisa preço final
    Vendedor->>Vendedor: Aplica desconto se necessário
    Vendedor->>DB: Envia ao cliente (status: pending_approval)
    
    alt Cliente aprova
        Cliente->>DB: Aprova ATO
        DB->>DB: Atualiza totais do contrato
        Note over DB: current_total_price += price_impact<br/>current_total_delivery_days += delivery_days_impact
    else Cliente rejeita
        Cliente->>DB: Rejeita ATO
        DB->>DB: Status: rejected
    end
```

**Tabelas envolvidas:**
- `additional_to_orders` - Dados do ATO
- `ato_configurations` - Items configurados no ATO
- `ato_workflow_steps` - Histórico de aprovações

**Arquivos envolvidos:**
- `src/hooks/useATOs.ts` - CRUD de ATOs
- `src/hooks/useATOWorkflow.ts` - Gerencia workflow
- `src/hooks/useSendATO.ts` - Envio ao cliente
- `supabase/functions/advance-ato-workflow/` - Edge function de avanço

---

## 7. Estados de ATO

Máquina de estados de um aditivo de contrato.

```mermaid
stateDiagram-v2
    [*] --> draft: ATO criado

    draft --> pm_review: Enviado para análise PM
    
    pm_review --> draft: PM completa análise (workflow_status: completed)
    pm_review --> rejected: PM rejeita

    draft --> pending_approval: Vendedor envia ao cliente
    
    pending_approval --> approved: Cliente aprova
    pending_approval --> rejected: Cliente rejeita
    
    approved --> [*]: Contrato atualizado
    rejected --> draft: Pode ser revisado
    rejected --> cancelled: Cancelado definitivamente

    note right of approved: Atualiza:\n- current_total_price\n- current_total_delivery_days\n- no contrato pai
```

**Status possíveis:**
- `draft` - Em edição ou aguardando análise PM
- `pending_approval` - Aguardando aprovação do cliente
- `approved` - Aprovado e aplicado ao contrato
- `rejected` - Rejeitado pelo cliente
- `cancelled` - Cancelado definitivamente

---

## 8. Criação de Contrato

Processo de conversão de cotação aceita em contrato.

```mermaid
sequenceDiagram
    actor Cliente
    participant Email as Email/Link Público
    participant DB as Supabase
    participant EdgeFn as create-contract-from-quotation

    Cliente->>Email: Recebe cotação
    Email->>Cliente: Link de aceite público (secure_token)
    
    Cliente->>DB: Aceita cotação
    DB->>DB: quotations.status → accepted
    DB->>DB: Salva accepted_at, accepted_by_name, accepted_by_email
    
    alt Criação automática ou manual
        DB->>EdgeFn: Trigger criação de contrato
        EdgeFn->>EdgeFn: Valida status (accepted/approved)
        EdgeFn->>EdgeFn: Gera contract_number (CTR-YYYY-XXXX)
        EdgeFn->>EdgeFn: Cria snapshot (base_snapshot JSON)
        EdgeFn->>DB: INSERT INTO contracts
        EdgeFn->>DB: Marca customizações como included_in_contract = true
        EdgeFn->>DB: quotations.status → converted_to_contract
        EdgeFn->>DB: Cria registro em audit_logs
    end
    
    Note over DB: Contrato ativo<br/>base_price = quotation.final_price<br/>base_delivery_days = quotation.total_delivery_days<br/>Pronto para receber ATOs
```

**Dados copiados para contrato:**
- `base_price` - Preço final da cotação (com descontos)
- `base_delivery_days` - Prazo total da cotação
- `base_snapshot` - JSON completo da cotação (memorial, opcionais, customizações)
- `current_total_price` - Inicialmente igual a base_price
- `current_total_delivery_days` - Inicialmente igual a base_delivery_days

**Arquivos envolvidos:**
- `supabase/functions/create-contract-from-quotation/` - Lógica de criação
- `src/hooks/useContracts.ts` - Gerenciamento de contratos

---

## 9. Conversão Customização → ATO

Fluxo de conversão de uma customização aprovada na cotação para um ATO no contrato.

```mermaid
flowchart LR
    A[Customização Aprovada<br/>na Cotação] --> B{Contrato Existe?}
    
    B -->|Não| C[Aguardar aceite<br/>do cliente]
    B -->|Sim| D[Converter para ATO]
    
    D --> E[Criar ATO<br/>ato_number, title, description]
    E --> F[Criar ato_configurations<br/>referencia customization original]
    F --> G[Workflow PM<br/>para análise]
    
    G --> H{PM Aprova?}
    H -->|Sim| I[Validação Comercial<br/>revisar preço]
    H -->|Não| J[ATO Rejeitado]
    
    I --> K[Enviar ao Cliente]
    K --> L{Cliente Aprova?}
    L -->|Sim| M[✅ Contrato Atualizado<br/>customization.ato_id = ato.id]
    L -->|Não| N[❌ ATO Cancelado]
```

**Quando usar:**
- Cliente solicita mudança após contrato assinado
- Customização não foi incluída no contrato original
- Necessidade de adicionar opcionais

**Arquivos envolvidos:**
- `src/hooks/useConvertCustomizationToATO.ts` - Lógica de conversão
- `src/components/contracts/ConvertCustomizationDialog.tsx` - Interface
- `supabase/functions/convert-customization-to-ato/` - Edge function

---

## 10. Referência de Status

### Cotações (quotations.status)

| Status | Descrição | Próximos Estados Válidos |
|--------|-----------|--------------------------|
| `draft` | Rascunho em edição | `pending_commercial_approval`, `pending_technical_approval`, `ready_to_send` |
| `pending_commercial_approval` | Aguardando aprovação de desconto | `ready_to_send`, `pending_technical_approval`, `rejected`, `draft` |
| `pending_technical_approval` | Aguardando análise técnica de customizações | `ready_to_send`, `pending_commercial_approval`, `rejected`, `draft` |
| `ready_to_send` | Aprovada e pronta para envio | `sent`, `draft` |
| `sent` | Enviada ao cliente (aguardando resposta) | `accepted`, `rejected`, `expired` |
| `accepted` | Cliente aceitou | `converted_to_contract` (após criação do contrato) |
| `expired` | Prazo de validade venceu (valid_until) | `draft` (nova versão) |
| `rejected` | Rejeitada (por aprovador ou cliente) | `draft` (nova versão) |

### ATOs (additional_to_orders.status)

| Status | Descrição | Próximos Estados Válidos |
|--------|-----------|--------------------------|
| `draft` | Em edição ou aguardando análise PM | `pending_approval`, `rejected` |
| `pending_approval` | Aguardando aprovação do cliente | `approved`, `rejected` |
| `approved` | Cliente aprovou e contrato foi atualizado | - (estado final) |
| `rejected` | Rejeitado pelo cliente ou PM | `draft`, `cancelled` |
| `cancelled` | Cancelado definitivamente | - (estado final) |

### Workflow Status (customizations & ATOs)

| workflow_status | Descrição |
|-----------------|-----------|
| `pending` | Aguardando início do workflow |
| `pm_review` | Em análise pelo PM |
| `supply_quote` | Compras cotando materiais (workflow completo) |
| `planning_check` | Planejamento validando janela (workflow completo) |
| `pm_final` | PM finalizando custos (workflow completo) |
| `completed` | Workflow concluído |
| `rejected` | Rejeitado em alguma etapa |

---

## Links Relacionados

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura geral do sistema
- **[DATABASE.md](./DATABASE.md)** - Schema completo do banco de dados
- **[WORKFLOW_SIMPLIFICADO.md](./WORKFLOW_SIMPLIFICADO.md)** - Detalhes do workflow simplificado
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Guia para novos desenvolvedores
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Guia completo de contribuição

---

## Notas Técnicas

### Configuração de Limites de Desconto

Os limites são editáveis dinamicamente em `/admin/discount-settings` e armazenados em `discount_limits_config`:

```sql
SELECT * FROM discount_limits_config;

-- Exemplo de resultado:
-- limit_type: 'base'
-- no_approval_max: 10
-- director_approval_max: 15
-- admin_approval_required_above: 15

-- limit_type: 'options'
-- no_approval_max: 8
-- director_approval_max: 12
-- admin_approval_required_above: 12
```

### Feature Toggle: Workflow Simplificado

Para ativar/desativar o workflow simplificado de customizações:

```sql
-- Ativar
UPDATE workflow_config 
SET config_value = '{"enabled": true}'::jsonb
WHERE config_key = 'use_simplified_workflow';

-- Desativar
UPDATE workflow_config 
SET config_value = '{"enabled": false}'::jsonb
WHERE config_key = 'use_simplified_workflow';

-- Verificar status
SELECT config_key, config_value 
FROM workflow_config 
WHERE config_key = 'use_simplified_workflow';
```

### Cálculo de Status de Cotação

O status de uma cotação é calculado dinamicamente pela função `calculateQuotationStatus()` em `src/lib/quotation-status-utils.ts`:

```typescript
const status = calculateQuotationStatus({
  hasDiscounts: baseDiscountPercentage > 0 || optionsDiscountPercentage > 0,
  baseDiscount: baseDiscountPercentage,
  optionsDiscount: optionsDiscountPercentage,
  hasCustomizations: customizations.length > 0,
  commercialApproved: commercialApprovalStatus === 'approved',
  technicalApproved: engineeringApprovalStatus === 'approved',
  isExpired: isAfter(new Date(), new Date(validUntil)),
  currentStatus: quotation.status
});
```

---

**Versão:** 1.0.0  
**Última atualização:** 2025-01-27  
**Mantenedor:** Equipe OKEAN Yachts
