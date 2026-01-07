
-- =====================================================
-- FIX RLS SECURITY ISSUES
-- Migration to address security linter warnings/errors
-- =====================================================

-- =====================================================
-- PART 1: Fix Views with SECURITY DEFINER (4 ERRORS)
-- Recreate views with security_invoker = true
-- =====================================================

-- 1.1 admin_dashboard_stats
DROP VIEW IF EXISTS admin_dashboard_stats;
CREATE VIEW admin_dashboard_stats 
WITH (security_invoker = true) AS
SELECT 
  (SELECT count(*) FROM yacht_models WHERE is_active = true) AS models_count,
  (SELECT count(*) FROM option_categories WHERE is_active = true) AS categories_count,
  (SELECT count(*) FROM options WHERE is_active = true) AS options_count,
  (SELECT count(*) FROM quotations) AS quotations_count,
  (SELECT count(*) FROM users WHERE is_active = true) AS users_count,
  (SELECT count(*) FROM contracts) AS contracts_count;

-- 1.2 contract_stats
DROP VIEW IF EXISTS contract_stats;
CREATE VIEW contract_stats 
WITH (security_invoker = true) AS
SELECT 
  count(DISTINCT c.id) AS total_contracts,
  count(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_contracts,
  count(DISTINCT c.id) FILTER (WHERE c.status = 'completed') AS completed_contracts,
  count(DISTINCT c.id) FILTER (WHERE c.status = 'cancelled') AS cancelled_contracts,
  COALESCE(sum(DISTINCT c.current_total_price), 0) AS total_revenue,
  count(a.id) AS total_atos,
  count(a.id) FILTER (WHERE a.status IN ('draft', 'pending_approval')) AS pending_atos,
  count(a.id) FILTER (WHERE a.status = 'approved') AS approved_atos,
  count(a.id) FILTER (WHERE a.status = 'rejected') AS rejected_atos,
  COALESCE(sum(a.price_impact) FILTER (WHERE a.status = 'approved'), 0) AS total_ato_revenue,
  COALESCE(avg(c.current_total_delivery_days), 0) AS avg_delivery_days
FROM contracts c
LEFT JOIN additional_to_orders a ON a.contract_id = c.id;

-- 1.3 quotation_stats
DROP VIEW IF EXISTS quotation_stats;
CREATE VIEW quotation_stats 
WITH (security_invoker = true) AS
SELECT 
  count(*) AS total,
  count(*) FILTER (WHERE status IN ('pending_commercial_approval', 'pending_technical_approval')) AS pending_approval,
  count(*) FILTER (WHERE status = 'ready_to_send') AS ready_to_send,
  count(*) FILTER (WHERE status = 'sent') AS sent,
  count(*) FILTER (WHERE status = 'accepted') AS accepted,
  count(*) FILTER (WHERE status = 'draft') AS draft,
  count(*) FILTER (WHERE status = 'sent' AND valid_until IS NOT NULL AND valid_until <= (CURRENT_DATE + interval '7 days') AND valid_until >= CURRENT_DATE) AS expiring_soon,
  COALESCE(sum(final_price) FILTER (WHERE status NOT IN ('rejected', 'expired')), 0) AS total_value,
  COALESCE(sum(final_price) FILTER (WHERE status = 'accepted'), 0) AS accepted_value,
  count(*) FILTER (WHERE created_at >= (now() - interval '30 days')) AS recent_quotations
FROM quotations;

-- 1.4 live_contracts
DROP VIEW IF EXISTS live_contracts;
CREATE VIEW live_contracts 
WITH (security_invoker = true) AS
SELECT 
  id,
  quotation_id,
  client_id,
  yacht_model_id,
  contract_number,
  base_price,
  base_delivery_days,
  base_snapshot,
  current_total_price,
  current_total_delivery_days,
  status,
  signed_at,
  signed_by_name,
  signed_by_email,
  created_at,
  updated_at,
  created_by,
  delivery_status,
  delivered_at,
  delivered_by,
  delivery_notes,
  hull_number_id
FROM contracts c
WHERE status = 'live';

-- =====================================================
-- PART 2: Fix Permissive INSERT Policies (8 WARNINGS)
-- Replace WITH CHECK (true) with proper authentication checks
-- =====================================================

-- 2.1 ato_configurations
DROP POLICY IF EXISTS "System can create configurations" ON ato_configurations;
CREATE POLICY "Authenticated users can create configurations"
  ON ato_configurations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2.2 ato_workflow_steps
DROP POLICY IF EXISTS "System can create ATO workflow steps" ON ato_workflow_steps;
CREATE POLICY "Authenticated users can create ATO workflow steps"
  ON ato_workflow_steps FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2.3 audit_logs - keep permissive for triggers but add service_role check
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System and authenticated can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL OR 
    current_setting('role', true) = 'service_role'
  );

-- 2.4 contract_delivery_checklist
DROP POLICY IF EXISTS "System can create delivery checklist items" ON contract_delivery_checklist;
CREATE POLICY "Authenticated users can create delivery checklist items"
  ON contract_delivery_checklist FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2.5 contracts
DROP POLICY IF EXISTS "System can create contracts" ON contracts;
CREATE POLICY "Authenticated users can create contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2.6 customization_workflow_steps
DROP POLICY IF EXISTS "System can create workflow steps" ON customization_workflow_steps;
CREATE POLICY "Authenticated users can create workflow steps"
  ON customization_workflow_steps FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2.7 mfa_recovery_codes
DROP POLICY IF EXISTS "System can create recovery codes" ON mfa_recovery_codes;
CREATE POLICY "Authenticated users can create recovery codes"
  ON mfa_recovery_codes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    has_role(auth.uid(), 'administrador')
  );

-- 2.8 quotation_customizations
DROP POLICY IF EXISTS "System can create customizations" ON quotation_customizations;
CREATE POLICY "Authenticated users can create customizations"
  ON quotation_customizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- PART 3: Fix Permissive SELECT Policies (2 WARNINGS)
-- Replace USING (true) with authentication checks
-- =====================================================

-- 3.1 clients - require authentication
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
CREATE POLICY "Authenticated users can view all clients"
  ON clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3.2 users - require authentication
DROP POLICY IF EXISTS "Authenticated users can view other users" ON users;
CREATE POLICY "Authenticated users can view other users"
  ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- PART 4: Fix Functions without search_path (2 WARNINGS)
-- Add SET search_path = public for security
-- =====================================================

-- 4.1 is_admin - recreate with search_path
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(auth.uid(), 'administrador')
$$;

-- 4.2 reset_role_permissions_to_default - recreate with search_path
CREATE OR REPLACE FUNCTION reset_role_permissions_to_default(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all custom permissions for this role
  DELETE FROM role_permissions_config
  WHERE role = _role AND is_default = false;
  
  -- Restore is_default = true for remaining ones
  UPDATE role_permissions_config
  SET is_default = true, updated_at = now()
  WHERE role = _role;
END;
$$;
