-- ============================================
-- RESTRINGIR CUSTOS DO SIMULADOR A ADMIN
-- ============================================

-- 1. simulator_model_costs
DROP POLICY IF EXISTS "Authenticated users can view model costs" ON simulator_model_costs;
DROP POLICY IF EXISTS "simulator_model_costs_read_all" ON simulator_model_costs;

CREATE POLICY "Only admins can view model costs"
ON simulator_model_costs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Only admins can manage model costs"
ON simulator_model_costs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- 2. simulator_business_rules
DROP POLICY IF EXISTS "Authenticated users can view business rules" ON simulator_business_rules;
DROP POLICY IF EXISTS "simulator_business_rules_read_all" ON simulator_business_rules;

CREATE POLICY "Only admins can view business rules"
ON simulator_business_rules
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Only admins can manage business rules"
ON simulator_business_rules
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- 3. simulator_commissions
DROP POLICY IF EXISTS "Authenticated users can view commissions" ON simulator_commissions;
DROP POLICY IF EXISTS "simulator_commissions_read_all" ON simulator_commissions;

CREATE POLICY "Only admins can view commissions"
ON simulator_commissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Only admins can manage commissions"
ON simulator_commissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- 4. simulator_exchange_rates
DROP POLICY IF EXISTS "Authenticated users can view exchange rates" ON simulator_exchange_rates;
DROP POLICY IF EXISTS "simulator_exchange_rates_read_all" ON simulator_exchange_rates;

CREATE POLICY "Only admins can view exchange rates"
ON simulator_exchange_rates
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Only admins can manage exchange rates"
ON simulator_exchange_rates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- 5. simulations - Restringir tudo a admin
DROP POLICY IF EXISTS "Users can create simulations" ON simulations;
DROP POLICY IF EXISTS "Users can view simulations" ON simulations;
DROP POLICY IF EXISTS "Users can update their own simulations" ON simulations;
DROP POLICY IF EXISTS "simulations_insert_owner" ON simulations;
DROP POLICY IF EXISTS "simulations_select_owner" ON simulations;
DROP POLICY IF EXISTS "simulations_update_owner" ON simulations;
DROP POLICY IF EXISTS "simulations_delete_owner" ON simulations;
DROP POLICY IF EXISTS "Users can view their own simulations" ON simulations;
DROP POLICY IF EXISTS "Users can delete their own simulations" ON simulations;

CREATE POLICY "Only admins can create simulations"
ON simulations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Only admins can view simulations"
ON simulations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Only admins can update simulations"
ON simulations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Only admins can delete simulations"
ON simulations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));