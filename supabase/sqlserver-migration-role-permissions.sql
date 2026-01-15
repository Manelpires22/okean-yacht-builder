-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: role_permissions_config (92 rows)
-- Generated: 2026-01-15 (Regenerated with valid UUIDs)
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

  -- Comercial
  ('97eebf19-b517-4089-9bde-847324316ab2', N'comercial', N'clients:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('e361c3ff-8b2d-42be-a519-3e3a4396862d', N'comercial', N'clients:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('3ca9cb2f-18ed-42ab-94b5-443beb16ff58', N'comercial', N'clients:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('0d36191d-630d-4ac5-83be-1e2b156c1d47', N'comercial', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('a656f304-d956-4de3-8a00-4780bfff3312', N'comercial', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('e0a2a89b-09bf-409b-a452-2952d3b37fa1', N'comercial', N'quotations:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('f913fab5-4f78-4a8f-a093-0d2b027f308c', N'comercial', N'quotations:edit_own', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('a959d4a4-001b-4522-9670-131797084bc5', N'comercial', N'quotations:view_own', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('9bc51b06-8a51-42e3-a4c1-61a26816430b', N'comercial', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Produção
  ('bed96a40-d4c6-485c-aa32-d9be9967cbbc', N'producao', N'customizations:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('2b6719d0-942e-45fe-b674-7c4357da179c', N'producao', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('813c68b7-e7e6-420f-9fc2-864e5e74f910', N'producao', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('d2b7bb2e-ab57-4856-84ce-5860a87ec010', N'producao', N'quotations:view_approved', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c0f6418e-0cf0-49f0-84cc-759f137629b7', N'producao', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Financeiro
  ('6d8f90e9-e763-440c-b554-fb5081982459', N'financeiro', N'clients:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('b5045e02-d335-4cd8-99b4-2e019c945065', N'financeiro', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('d0ebb99e-86a8-404f-bb0c-de5ff26b77b8', N'financeiro', N'quotations:view_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('d5e95f8a-0f76-4076-99f4-2bc9bbda8b8a', N'financeiro', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- PM Engenharia
  ('ad7477b3-7a47-4ed9-89cf-0a83fcd20e01', N'pm_engenharia', N'customizations:approve', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('769aa89b-e81c-41ef-a7fb-812ca674e663', N'pm_engenharia', N'customizations:review', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('7161488d-e316-43bc-9dcb-33661ffbb0cb', N'pm_engenharia', N'customizations:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('34761bf9-9064-48dd-bf75-4c2199d98649', N'pm_engenharia', N'memorial:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('63166c1a-21f1-4ea1-a582-4f8b6f469564', N'pm_engenharia', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('9e4c2e37-8a37-429b-b12f-2cdc48aa8ea5', N'pm_engenharia', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('3b84a0e7-9352-4f35-bcea-92a28397c486', N'pm_engenharia', N'quotations:view_assigned', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('248eac9c-31fa-42e8-a826-f68d992c33b9', N'pm_engenharia', N'workflow:manage', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('52bbf6e6-f69d-48ff-adfd-e8a6b819696b', N'pm_engenharia', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Comprador
  ('996a7e51-cdbc-4862-8e63-0f19c2e8ae6b', N'comprador', N'customizations:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('97917c90-af89-4e64-bf3e-668c85370af1', N'comprador', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('4e0e3c35-6388-41c7-991c-6f73d87bf646', N'comprador', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('5633deab-fda5-4ece-97e8-d9e5d531b69e', N'comprador', N'quotations:view_assigned', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('5fc7b399-a94c-48ac-8ed0-a444202fe053', N'comprador', N'workflow:supply', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Planejador
  ('14cb6a28-2de8-44bb-9400-0c678b4c78bd', N'planejador', N'customizations:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('79355003-fdb3-41bc-8071-37f8a5eed93b', N'planejador', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c58369ef-d774-486e-b832-457a55cf3990', N'planejador', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('784b9403-96f1-4ef2-91c6-3e981508d267', N'planejador', N'quotations:view_assigned', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('2fbb999f-6e9b-43cd-9eae-4288f44b649a', N'planejador', N'workflow:planning', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('7e3dd492-0166-413b-8901-eb0bc9e7fdb2', N'planejador', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Broker
  ('c8aa5f98-0f21-433d-b464-569b1aaf1a9c', N'broker', N'clients:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('9158e33a-5f80-4692-b2f9-c50f4377f972', N'broker', N'clients:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('e45f6768-cc69-4c14-a61d-93021587410d', N'broker', N'clients:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c8fe8611-c2c7-463b-9a4f-d42c0f26fc9f', N'broker', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('8cbbed16-a139-492c-986c-519cb51c0ee3', N'broker', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('aac1888d-993b-4e90-a2b1-51b5d65ec851', N'broker', N'quotations:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c1ab7bc8-2181-4d08-b95b-3e4e773915da', N'broker', N'quotations:edit_own', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('16e1af8b-6a90-460f-9218-31446b921180', N'broker', N'quotations:view_own', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('f3e7b207-9393-4405-8183-a12eb526904c', N'broker', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Diretor Comercial
  ('81bfb010-c49d-4e25-a493-00e23baec009', N'diretor_comercial', N'approvals:approve_discount', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('afb29728-3236-4f26-b102-fa3adfe786dd', N'diretor_comercial', N'approvals:review', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('112b22c4-768b-4d31-a2fc-23722ea4d142', N'diretor_comercial', N'approvals:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('bc1c954b-71bd-4b08-bfbd-3ed1808359c0', N'diretor_comercial', N'clients:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('6d9dcd14-958a-45de-8f43-1cfc9578476c', N'diretor_comercial', N'clients:delete', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('8af3ee0e-33a4-4a75-a4ad-c36e2243b83a', N'diretor_comercial', N'clients:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('5a5be589-5646-4c57-a8b1-1f4f6e17ce8a', N'diretor_comercial', N'clients:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('bd15b4f2-a76b-486f-8e8c-a1a37edfa9c5', N'diretor_comercial', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('ae8185f2-5973-4601-8e97-549202a5723e', N'diretor_comercial', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('4adf165d-be75-44a6-a985-666aade57530', N'diretor_comercial', N'quotations:approve', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('9e154347-efec-429c-94f5-3e9d828c2ddf', N'diretor_comercial', N'quotations:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('ebebbff1-fea9-4c3f-9469-0defdd845a02', N'diretor_comercial', N'quotations:edit_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('6a2134cd-af5c-4289-874c-76de24a93966', N'diretor_comercial', N'quotations:send', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('2bfa3c44-e455-463b-a893-111c6be93284', N'diretor_comercial', N'quotations:view_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('c8f285e0-6764-4b63-896a-0e47b2002927', N'diretor_comercial', N'users:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('3ba8dd09-1623-4e63-8006-87a4edebaa68', N'diretor_comercial', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),

  -- Backoffice Comercial
  ('37e95c24-bcbd-45fd-97b5-6e3467c6c80b', N'backoffice_comercial', N'clients:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('0efa4491-d082-41f1-a085-696c4c4f66f6', N'backoffice_comercial', N'clients:edit', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('fe6fc6b1-7cc7-4881-830a-2f61f874150c', N'backoffice_comercial', N'clients:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('b308b18e-f5a3-4d27-b241-1afb9358098a', N'backoffice_comercial', N'memorial:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('ef2d574e-d0ee-4a21-824f-aed9254a06fe', N'backoffice_comercial', N'options:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('77423625-1814-4aee-af9f-57d26a41ab71', N'backoffice_comercial', N'quotations:create', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('d8e3f492-8c7a-4f21-b3d5-6e8f9a1b2c3d', N'backoffice_comercial', N'quotations:edit_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', N'backoffice_comercial', N'quotations:send', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('1234abcd-5678-90ef-abcd-1234567890ab', N'backoffice_comercial', N'quotations:view_all', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL),
  ('abcd1234-ef56-7890-1234-abcdef567890', N'backoffice_comercial', N'yacht_models:view', 1, 1, '2025-10-27T15:06:12.792', '2025-10-27T15:06:12.792', NULL);
GO

-- =============================================
-- Total: 92 rows (all with valid hexadecimal UUIDs)
-- =============================================

PRINT 'role_permissions_config data inserted successfully.';
GO
