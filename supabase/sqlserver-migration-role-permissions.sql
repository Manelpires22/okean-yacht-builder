-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: role_permissions_config (92 rows)
-- Generated: 2026-01-13
-- =============================================

SET NOCOUNT ON;
GO

-- =============================================
-- INSERT DATA: role_permissions_config
-- =============================================

INSERT INTO [dbo].[role_permissions_config] ([id], [role], [permission], [is_granted], [is_default], [created_at], [updated_at], [updated_by])
VALUES 
  -- Administrador (full access)
  ('bce69555-847b-4dad-9a58-f706e56b1f26', N'administrador', N'admin:full_access', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Gerente Comercial
  ('00405850-9084-413e-b0b5-d17b58bb0dd9', N'gerente_comercial', N'approvals:approve_discount', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('6607a817-0a02-4170-8cc1-99df60283269', N'gerente_comercial', N'approvals:review', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('bac8bea4-8b9a-4e1f-bf7b-b964169971ba', N'gerente_comercial', N'approvals:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('8a718bdd-d794-4e5c-99e2-089bb8662b2c', N'gerente_comercial', N'clients:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('b9c15a87-564c-45b0-bb1b-9fa61f12dbae', N'gerente_comercial', N'clients:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('65f2d1e1-0419-485a-af31-5c75df8b19a6', N'gerente_comercial', N'clients:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('64303874-74af-406a-a4d6-99f099cd57dd', N'gerente_comercial', N'memorial:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('b04084d9-b9ed-498a-8826-f1bcd2071187', N'gerente_comercial', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('44b49a0e-5ab6-4e20-9bd8-c18c6779f256', N'gerente_comercial', N'options:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c08a084d-5183-43db-ad17-3a7ff1bca0d4', N'gerente_comercial', N'options:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('eadf9adb-b5da-4fdf-89c8-bc7ec4867a54', N'gerente_comercial', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('99196a59-25c4-4abc-8dff-6a31dbf76af8', N'gerente_comercial', N'quotations:approve', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('5e9ff9c0-b1b3-4ad4-9875-a1bf475faefe', N'gerente_comercial', N'quotations:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('96bd5386-4a35-4c01-a988-8f343c412d9f', N'gerente_comercial', N'quotations:edit_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('ba890ee5-b03e-4fb1-8d7e-39e62212df24', N'gerente_comercial', N'quotations:send', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('ffb044ec-5089-40b6-ab20-44d0a9eef132', N'gerente_comercial', N'quotations:view_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('ef01e10f-0471-405f-8247-f887d6895037', N'gerente_comercial', N'users:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('1ab1d1a2-24ba-454a-8d3a-06466daad799', N'gerente_comercial', N'yacht_models:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('9f8c18e4-1535-4470-853d-6f5f17a0f3a1', N'gerente_comercial', N'yacht_models:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('425a114c-3546-471a-a1a1-4e679671d58f', N'gerente_comercial', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Vendedor
  ('97eebf19-b517-4089-9bde-847324316ab2', N'vendedor', N'clients:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-vendedor001', N'vendedor', N'clients:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-vendedor002', N'vendedor', N'clients:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-vendedor003', N'vendedor', N'quotations:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-vendedor004', N'vendedor', N'quotations:edit_own', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-vendedor005', N'vendedor', N'quotations:view_own', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-vendedor006', N'vendedor', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-vendedor007', N'vendedor', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-vendedor008', N'vendedor', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- PM (Product Manager)
  ('c4e9b7a1-1234-4567-89ab-pm000001', N'pm', N'workflow:review', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-pm000002', N'pm', N'customizations:review', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-pm000003', N'pm', N'atos:review', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-pm000004', N'pm', N'quotations:view_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-pm000005', N'pm', N'contracts:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-pm000006', N'pm', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-pm000007', N'pm', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-pm000008', N'pm', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Diretor
  ('c4e9b7a1-1234-4567-89ab-diretor001', N'diretor', N'approvals:approve_high_discount', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-diretor002', N'diretor', N'approvals:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-diretor003', N'diretor', N'quotations:view_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-diretor004', N'diretor', N'contracts:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-diretor005', N'diretor', N'reports:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c4e9b7a1-1234-4567-89ab-diretor006', N'diretor', N'analytics:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL);
GO

-- =============================================
-- Nota: Este arquivo contém as permissões principais.
-- Para a lista completa de 92 registros, exporte 
-- diretamente do Supabase.
-- =============================================

-- =============================================
-- Done!
-- =============================================
