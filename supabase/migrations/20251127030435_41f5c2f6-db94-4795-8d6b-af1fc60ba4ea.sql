-- ============================================
-- Migration: Cleanup Old Workflow Tables
-- ============================================

-- ============================================
-- 1. CRIAR BACKUPS
-- ============================================
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  CREATE TABLE IF NOT EXISTS approvals_backup AS 
  SELECT * FROM approvals;
  
  SELECT COUNT(*) INTO backup_count FROM approvals_backup;
  RAISE NOTICE 'Backup: % registros', backup_count;
END $$;

-- ============================================
-- 2. VERIFICAR APROVAÇÕES PENDENTES
-- ============================================
DO $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM approvals WHERE status = 'pending';
  
  IF pending_count > 0 THEN
    RAISE EXCEPTION 'ABORTAR: % aprovações pendentes!', pending_count;
  END IF;
  
  RAISE NOTICE 'OK: Nenhuma aprovação pendente';
END $$;

-- ============================================
-- 3. REMOVER CONSTRAINTS ANTIGOS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== Removendo constraints antigos ===';
  
  -- Remover constraint antigo se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_workflow_status'
    AND table_name = 'quotation_customizations'
  ) THEN
    ALTER TABLE quotation_customizations 
    DROP CONSTRAINT check_workflow_status;
    RAISE NOTICE 'Constraint antigo check_workflow_status removido';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_workflow_status'
    AND table_name = 'quotation_customizations'
  ) THEN
    ALTER TABLE quotation_customizations 
    DROP CONSTRAINT valid_workflow_status;
    RAISE NOTICE 'Constraint valid_workflow_status removido';
  END IF;
END $$;

-- ============================================
-- 4. NORMALIZAR WORKFLOW_STATUS
-- ============================================
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  RAISE NOTICE '=== Normalizando workflow_status ===';
  
  -- Normalizar valores
  UPDATE quotation_customizations
  SET workflow_status = CASE
    WHEN workflow_status IS NULL THEN 'pending_pm_review'
    WHEN workflow_status = 'pending' THEN 'pending_pm_review'
    WHEN workflow_status = 'approved' THEN 'approved_technical'
    WHEN workflow_status = 'in_progress' THEN 'pending_pm_review'
    WHEN workflow_status NOT IN (
      'pending_pm_review',
      'pending_engineering',
      'pending_supply',
      'pending_planning',
      'pending_commercial',
      'approved_commercial',
      'pending_technical',
      'approved_technical',
      'rejected',
      'completed'
    ) THEN 'pending_pm_review'
    ELSE workflow_status
  END;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Valores normalizados: %', updated_count;
END $$;

-- ============================================
-- 5. REMOVER FOREIGN KEYS E TABELAS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== Removendo tabelas antigas ===';
  
  -- Remover FK
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'approvals_quotation_id_fkey'
  ) THEN
    ALTER TABLE approvals DROP CONSTRAINT approvals_quotation_id_fkey;
  END IF;
  
  -- Desabilitar RLS e dropar
  EXECUTE 'ALTER TABLE IF EXISTS approvals DISABLE ROW LEVEL SECURITY';
  DROP POLICY IF EXISTS "Managers and admins can review approvals" ON approvals;
  DROP POLICY IF EXISTS "System can create approvals" ON approvals;
  DROP POLICY IF EXISTS "Users can view their own approval requests" ON approvals;
  DROP TABLE IF EXISTS approvals CASCADE;
  DROP TABLE IF EXISTS workflow_tasks CASCADE;
  
  RAISE NOTICE 'Tabelas antigas removidas';
END $$;

-- ============================================
-- 6. ADICIONAR NOVO CONSTRAINT
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== Adicionando novo constraint ===';
  
  ALTER TABLE quotation_customizations
  ADD CONSTRAINT valid_workflow_status
  CHECK (workflow_status IN (
    'pending_pm_review',
    'pending_engineering',
    'pending_supply',
    'pending_planning',
    'pending_commercial',
    'approved_commercial',
    'pending_technical',
    'approved_technical',
    'rejected',
    'completed'
  ));
  
  -- Configurar default e NOT NULL
  ALTER TABLE quotation_customizations
  ALTER COLUMN workflow_status SET DEFAULT 'pending_pm_review';
  
  ALTER TABLE quotation_customizations
  ALTER COLUMN workflow_status SET NOT NULL;
  
  RAISE NOTICE 'Constraint e configurações aplicados';
END $$;

-- ============================================
-- 7. CRIAR ÍNDICES
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== Criando índices ===';
  
  CREATE INDEX IF NOT EXISTS idx_customizations_workflow_status 
  ON quotation_customizations(workflow_status);
  
  CREATE INDEX IF NOT EXISTS idx_customizations_quotation_workflow 
  ON quotation_customizations(quotation_id, workflow_status);
  
  CREATE INDEX IF NOT EXISTS idx_customizations_reviewed_by 
  ON quotation_customizations(reviewed_by) 
  WHERE reviewed_by IS NOT NULL;
  
  CREATE INDEX IF NOT EXISTS idx_customizations_reviewed_at 
  ON quotation_customizations(reviewed_at) 
  WHERE reviewed_at IS NOT NULL;
  
  CREATE INDEX IF NOT EXISTS idx_customization_steps_status 
  ON customization_workflow_steps(status);
  
  CREATE INDEX IF NOT EXISTS idx_customization_steps_assigned 
  ON customization_workflow_steps(assigned_to) 
  WHERE assigned_to IS NOT NULL;
  
  CREATE INDEX IF NOT EXISTS idx_customization_steps_customization 
  ON customization_workflow_steps(customization_id, status);
  
  CREATE INDEX IF NOT EXISTS idx_ato_steps_status 
  ON ato_workflow_steps(status);
  
  CREATE INDEX IF NOT EXISTS idx_ato_steps_assigned 
  ON ato_workflow_steps(assigned_to) 
  WHERE assigned_to IS NOT NULL;
  
  CREATE INDEX IF NOT EXISTS idx_ato_steps_ato 
  ON ato_workflow_steps(ato_id, status);
  
  RAISE NOTICE 'Índices criados';
END $$;

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================
COMMENT ON COLUMN quotation_customizations.workflow_status IS 
'Status simplificado: pending_pm_review, pending_engineering, pending_supply, pending_planning, pending_commercial, approved_commercial, pending_technical, approved_technical, rejected, completed';

-- ============================================
-- RESUMO
-- ============================================
DO $$
DECLARE
  customizations INTEGER;
  steps INTEGER;
  ato_steps INTEGER;
  backup INTEGER;
BEGIN
  SELECT COUNT(*) INTO customizations FROM quotation_customizations;
  SELECT COUNT(*) INTO steps FROM customization_workflow_steps;
  SELECT COUNT(*) INTO ato_steps FROM ato_workflow_steps;
  SELECT COUNT(*) INTO backup FROM approvals_backup;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION CONCLUÍDA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customizações: %', customizations;
  RAISE NOTICE 'Workflow steps: %', steps;
  RAISE NOTICE 'ATO steps: %', ato_steps;
  RAISE NOTICE 'Backup: % registros', backup;
  RAISE NOTICE 'Índices: 10 criados';
  RAISE NOTICE '========================================';
END $$;