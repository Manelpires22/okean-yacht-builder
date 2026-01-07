-- =============================================
-- CONFIGURAÇÃO DE AUTOVACUUM PARA TABELAS PEQUENAS
-- =============================================

-- option_categories (7 rows, 26 dead tuples)
ALTER TABLE option_categories SET (
  autovacuum_vacuum_threshold = 5,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 5,
  autovacuum_analyze_scale_factor = 0.05
);

-- ato_configurations (3 rows, 25 dead tuples)
ALTER TABLE ato_configurations SET (
  autovacuum_vacuum_threshold = 3,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 3,
  autovacuum_analyze_scale_factor = 0.05
);

-- pdf_templates (1 row, 4 dead tuples)
ALTER TABLE pdf_templates SET (
  autovacuum_vacuum_threshold = 2,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 2,
  autovacuum_analyze_scale_factor = 0.05
);

-- memorial_upgrades (17 rows, 21 dead tuples)
ALTER TABLE memorial_upgrades SET (
  autovacuum_vacuum_threshold = 10,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 10,
  autovacuum_analyze_scale_factor = 0.05
);

-- simulator_model_costs (8 rows, 11 dead tuples)
ALTER TABLE simulator_model_costs SET (
  autovacuum_vacuum_threshold = 5,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 5,
  autovacuum_analyze_scale_factor = 0.05
);

-- simulator_business_rules (9 rows, 10 dead tuples)
ALTER TABLE simulator_business_rules SET (
  autovacuum_vacuum_threshold = 5,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 5,
  autovacuum_analyze_scale_factor = 0.05
);

-- simulator_commissions (12 rows, 6 dead tuples)
ALTER TABLE simulator_commissions SET (
  autovacuum_vacuum_threshold = 5,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 5,
  autovacuum_analyze_scale_factor = 0.05
);

-- workflow_config (3 rows, 3 dead tuples)
ALTER TABLE workflow_config SET (
  autovacuum_vacuum_threshold = 2,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 2,
  autovacuum_analyze_scale_factor = 0.05
);

-- clients (3 rows, 4 dead tuples)
ALTER TABLE clients SET (
  autovacuum_vacuum_threshold = 3,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 3,
  autovacuum_analyze_scale_factor = 0.05
);