-- ============================================================================
-- SCRIPT DE VALIDAÇÃO DA MIGRAÇÃO DO WORKFLOW
-- ============================================================================
-- Este script contém queries para validar que a migração do sistema de
-- aprovações antigo para o novo workflow simplificado foi bem-sucedida.
--
-- Execute estas queries após rodar a migration cleanup_old_workflow.sql
-- ============================================================================

-- ============================================================================
-- 1. CONTAR CUSTOMIZAÇÕES MIGRADAS POR WORKFLOW_STATUS
-- ============================================================================
-- Verifica a distribuição de customizações pelo novo campo workflow_status
-- Valores esperados: pending_pm_review, pending_supply, pending_planning, 
--                    approved_technical, rejected
-- ============================================================================

SELECT 
  workflow_status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM quotation_customizations
GROUP BY workflow_status
ORDER BY total DESC;

-- ============================================================================
-- 2. VERIFICAR INTEGRIDADE DE DADOS - CUSTOMIZAÇÕES
-- ============================================================================
-- Garante que todas as customizações têm:
-- - workflow_status válido (NOT NULL)
-- - quotation_id válido
-- - status consistente com workflow_status
-- ============================================================================

-- 2.1. Verificar se há workflow_status NULL (NÃO deveria existir)
SELECT 
  'workflow_status NULL' as problema,
  COUNT(*) as total
FROM quotation_customizations
WHERE workflow_status IS NULL;

-- 2.2. Verificar se há quotation_id inválidos
SELECT 
  'quotation_id inválido' as problema,
  COUNT(*) as total
FROM quotation_customizations qc
LEFT JOIN quotations q ON q.id = qc.quotation_id
WHERE q.id IS NULL;

-- 2.3. Verificar consistência entre status antigo e workflow_status novo
SELECT 
  qc.status as status_antigo,
  qc.workflow_status as workflow_status_novo,
  COUNT(*) as total
FROM quotation_customizations qc
GROUP BY qc.status, qc.workflow_status
ORDER BY total DESC;

-- ============================================================================
-- 3. LISTAR CUSTOMIZAÇÕES SEM WORKFLOW STEPS
-- ============================================================================
-- Identifica customizações que deveriam ter workflow steps mas não têm
-- (pode indicar problema na criação automática de steps)
-- ============================================================================

SELECT 
  qc.id,
  qc.item_name,
  qc.workflow_status,
  qc.created_at,
  q.quotation_number,
  COUNT(cws.id) as steps_count
FROM quotation_customizations qc
JOIN quotations q ON q.id = qc.quotation_id
LEFT JOIN customization_workflow_steps cws ON cws.customization_id = qc.id
WHERE qc.workflow_status != 'approved_technical'
  AND qc.workflow_status != 'rejected'
GROUP BY qc.id, qc.item_name, qc.workflow_status, qc.created_at, q.quotation_number
HAVING COUNT(cws.id) = 0
ORDER BY qc.created_at DESC;

-- ============================================================================
-- 4. VERIFICAR QUE TABELAS ANTIGAS NÃO EXISTEM
-- ============================================================================
-- Confirma que as tabelas do sistema antigo foram removidas
-- Resultado esperado: 0 linhas para ambas as tabelas
-- ============================================================================

SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = t.table_name
    ) THEN '❌ EXISTE (ERRO!)'
    ELSE '✅ REMOVIDA (OK)'
  END as status
FROM (
  VALUES 
    ('approvals'),
    ('workflow_tasks')
) AS t(table_name);

-- ============================================================================
-- 5. VALIDAR QUE BACKUPS FORAM CRIADOS
-- ============================================================================
-- Verifica se as tabelas de backup existem e contêm dados
-- ============================================================================

-- 5.1. Verificar existência da tabela de backup
SELECT 
  'approvals_backup' as tabela_backup,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'approvals_backup'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE (ERRO!)'
  END as status;

-- 5.2. Contar registros no backup (se existir)
SELECT 
  COUNT(*) as total_registros_backup
FROM approvals_backup;

-- 5.3. Comparar estatísticas do backup vs sistema novo
SELECT 
  'Comparativo Backup vs Novo Sistema' as analise,
  (SELECT COUNT(*) FROM approvals_backup) as backup_total,
  (SELECT COUNT(*) FROM quotation_customizations) as customizacoes_total,
  (SELECT COUNT(*) FROM customization_workflow_steps) as workflow_steps_total;

-- ============================================================================
-- 6. ESTATÍSTICAS DE PERFORMANCE E ÍNDICES
-- ============================================================================
-- Verifica se os índices foram criados corretamente para otimização
-- ============================================================================

-- 6.1. Listar índices criados na tabela quotation_customizations
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'quotation_customizations'
  AND indexname LIKE '%workflow%'
ORDER BY indexname;

-- 6.2. Listar índices nas tabelas de workflow steps
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('customization_workflow_steps', 'ato_workflow_steps')
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. VALIDAR CONSTRAINTS
-- ============================================================================
-- Verifica se os constraints de validação estão ativos
-- ============================================================================

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'quotation_customizations'::regclass
  AND conname LIKE '%workflow%'
ORDER BY conname;

-- ============================================================================
-- 8. ANÁLISE DE COTAÇÕES COM CUSTOMIZAÇÕES PENDENTES
-- ============================================================================
-- Identifica cotações que ainda têm customizações em workflow pendente
-- ============================================================================

SELECT 
  q.quotation_number,
  q.status as quotation_status,
  q.client_name,
  COUNT(qc.id) as total_customizacoes,
  COUNT(CASE WHEN qc.workflow_status IN ('pending_pm_review', 'pending_supply', 'pending_planning') THEN 1 END) as pendentes,
  COUNT(CASE WHEN qc.workflow_status = 'approved_technical' THEN 1 END) as aprovadas,
  COUNT(CASE WHEN qc.workflow_status = 'rejected' THEN 1 END) as rejeitadas
FROM quotations q
LEFT JOIN quotation_customizations qc ON qc.quotation_id = q.id
WHERE qc.id IS NOT NULL
GROUP BY q.id, q.quotation_number, q.status, q.client_name
HAVING COUNT(CASE WHEN qc.workflow_status IN ('pending_pm_review', 'pending_supply', 'pending_planning') THEN 1 END) > 0
ORDER BY pendentes DESC;

-- ============================================================================
-- 9. RESUMO EXECUTIVO DA MIGRAÇÃO
-- ============================================================================
-- View consolidada do status da migração
-- ============================================================================

WITH migration_stats AS (
  SELECT 
    (SELECT COUNT(*) FROM quotation_customizations) as total_customizacoes,
    (SELECT COUNT(*) FROM quotation_customizations WHERE workflow_status = 'approved_technical') as aprovadas,
    (SELECT COUNT(*) FROM quotation_customizations WHERE workflow_status IN ('pending_pm_review', 'pending_supply', 'pending_planning')) as pendentes,
    (SELECT COUNT(*) FROM quotation_customizations WHERE workflow_status = 'rejected') as rejeitadas,
    (SELECT COUNT(*) FROM customization_workflow_steps) as total_steps,
    (SELECT COUNT(*) FROM approvals_backup) as backup_registros,
    (SELECT NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approvals')) as tabela_antiga_removida
)
SELECT 
  '=== RESUMO DA MIGRAÇÃO ===' as titulo,
  total_customizacoes as "Total Customizações",
  aprovadas as "✅ Aprovadas",
  pendentes as "⏳ Pendentes",
  rejeitadas as "❌ Rejeitadas",
  total_steps as "Total Workflow Steps",
  backup_registros as "Registros no Backup",
  CASE 
    WHEN tabela_antiga_removida THEN '✅ Sim' 
    ELSE '❌ Não (ERRO!)' 
  END as "Tabela Antiga Removida"
FROM migration_stats;

-- ============================================================================
-- 10. VERIFICAR FUNÇÕES E TRIGGERS
-- ============================================================================
-- Lista funções e triggers relevantes ao workflow
-- ============================================================================

-- 10.1. Funções relacionadas ao workflow
SELECT 
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%workflow%'
    OR routine_name LIKE '%customization%'
    OR routine_name LIKE '%ato%'
  )
ORDER BY routine_name;

-- 10.2. Triggers relacionados ao workflow
SELECT 
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND (
    trigger_name LIKE '%workflow%'
    OR trigger_name LIKE '%customization%'
    OR event_object_table IN ('quotation_customizations', 'customization_workflow_steps', 'ato_workflow_steps')
  )
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- FIM DO SCRIPT DE VALIDAÇÃO
-- ============================================================================
-- 
-- COMO USAR ESTE SCRIPT:
-- 1. Execute no Supabase SQL Editor após rodar a migration
-- 2. Revise cada seção e verifique os resultados
-- 3. Preste atenção especial em:
--    - Seção 4: Tabelas antigas devem estar REMOVIDAS
--    - Seção 5: Backups devem EXISTIR e ter dados
--    - Seção 9: Resumo deve mostrar consistência
-- 
-- EM CASO DE PROBLEMAS:
-- - Se tabela antiga ainda existe: migration não completou
-- - Se backup não existe: dados podem ter sido perdidos
-- - Se há customizações sem workflow_status: trigger não funcionou
-- 
-- PRÓXIMOS PASSOS APÓS VALIDAÇÃO:
-- 1. Se tudo OK: monitorar aplicação em produção
-- 2. Se houver problemas: revisar logs da migration
-- 3. Considerar criar um script de rollback se necessário
-- ============================================================================
