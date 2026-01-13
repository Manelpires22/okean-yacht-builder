-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: audit_logs (3108 rows)
-- Generated: 2026-01-13
-- =============================================

SET NOCOUNT ON;
GO

-- =============================================
-- NOTA IMPORTANTE
-- =============================================
-- Esta tabela contém 3108 registros de auditoria.
-- Por questões de performance, recomendamos:
--
-- 1. Exportar dados via CSV usando o script Node.js:
--    node scripts/export-data-for-sqlserver.js --format=csv
--
-- 2. Importar via BULK INSERT no SQL Server:
--    BULK INSERT [dbo].[audit_logs]
--    FROM 'C:\path\to\audit_logs.csv'
--    WITH (
--      FIELDTERMINATOR = ',',
--      ROWTERMINATOR = '\n',
--      FIRSTROW = 2,
--      CODEPAGE = '65001'
--    );
--
-- 3. Ou use o Azure Data Factory para migração em massa.
--
-- Abaixo está uma amostra dos registros mais recentes:
-- =============================================

-- =============================================
-- INSERT DATA: audit_logs (sample - últimos 50 registros)
-- =============================================

INSERT INTO [dbo].[audit_logs] ([id], [user_id], [user_email], [user_name], [action], [table_name], [record_id], [old_values], [new_values], [changed_fields], [metadata], [ip_address], [user_agent], [route], [created_at])
VALUES 
  -- Login events
  ('54571185-b31b-4bab-9089-e9f769de9210', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T16:19:53.204Z"}', NULL, NULL, NULL, '2026-01-13T16:19:54.011'),
  ('c862509f-d6af-4b89-bc3f-7bc983545cea', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T16:19:53.209Z"}', NULL, NULL, NULL, '2026-01-13T16:19:53.815'),
  ('e6818c87-2e24-4e1c-aa06-8e637504171a', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T16:16:24.141Z"}', NULL, NULL, NULL, '2026-01-13T16:16:24.559'),
  ('9fd26027-c79f-4a1d-af49-42aa066a8b6e', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T16:15:07.189Z"}', NULL, NULL, NULL, '2026-01-13T16:15:07.672'),
  ('74de99e9-6ac9-40a0-8d10-12c0ad8836f2', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T16:15:07.023Z"}', NULL, NULL, NULL, '2026-01-13T16:15:07.433'),
  ('fdf2f569-7dfd-4352-b09f-51f1d40770b2', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T16:05:05.983Z"}', NULL, NULL, NULL, '2026-01-13T16:05:06.366'),
  ('cef8ac07-cf11-4a80-8343-e86649f90b3d', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T16:00:13.801Z"}', NULL, NULL, NULL, '2026-01-13T16:00:14.176'),
  ('4bd6eb73-ed35-4a6c-a807-b826258b1590', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T15:51:53.391Z"}', NULL, NULL, NULL, '2026-01-13T15:51:54.004'),
  ('d416b1d3-e8ec-4721-b8de-14b9ebfde525', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T15:28:47.104Z"}', NULL, NULL, NULL, '2026-01-13T15:28:47.519'),
  ('ea780f37-398c-49d3-945f-c2449d964b85', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', NULL, NULL, NULL, NULL, NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-13T15:28:47.093Z"}', NULL, NULL, NULL, '2026-01-13T15:28:47.260');
GO

-- =============================================
-- INSTRUÇÃO PARA EXPORTAR DADOS COMPLETOS
-- =============================================
-- Execute no Supabase SQL Editor:
--
-- SELECT 
--   id,
--   user_id,
--   user_email,
--   user_name,
--   action,
--   table_name,
--   record_id,
--   old_values::text as old_values,
--   new_values::text as new_values,
--   changed_fields,
--   metadata::text as metadata,
--   ip_address::text as ip_address,
--   user_agent,
--   route,
--   created_at
-- FROM audit_logs
-- ORDER BY created_at DESC;
--
-- Então exporte como CSV e importe via BULK INSERT.
-- =============================================

-- =============================================
-- Done!
-- =============================================
