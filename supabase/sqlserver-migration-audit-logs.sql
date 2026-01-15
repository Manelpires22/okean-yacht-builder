-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: audit_logs (3166 rows) - WITH JSON FIELDS
-- Generated: 2026-01-15
-- =============================================

SET NOCOUNT ON;
GO

-- =============================================
-- NOTA IMPORTANTE - CAMPOS JSON INCLUÍDOS
-- =============================================
-- Esta versão inclui TODOS os campos, incluindo campos JSON:
-- - old_values (NVARCHAR(MAX)) - Valores anteriores à modificação
-- - new_values (NVARCHAR(MAX)) - Novos valores após modificação
-- - metadata (NVARCHAR(MAX)) - Metadados do evento (timestamp, etc.)
--
-- JSON é armazenado como NVARCHAR(MAX) no SQL Server.
-- Use OPENJSON() para parsear no SQL Server 2016+.
--
-- RECOMENDAÇÃO: Para 3166+ registros, use BULK INSERT
-- =============================================

-- =============================================
-- INSERT DATA: audit_logs (sample - últimos 20 registros com JSON)
-- =============================================

INSERT INTO [dbo].[audit_logs] (
  [id], [user_id], [user_email], [user_name], [action], 
  [table_name], [record_id], [old_values], [new_values], 
  [changed_fields], [metadata], [route], [user_agent], [created_at]
)
VALUES 
  -- Login events com metadata JSON
  ('90e81982-a8c4-4afd-8f92-54fd439eee66', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T13:11:55.121Z"}', NULL, NULL, '2026-01-15T13:11:55.611'),
  
  ('d6b73c3b-708e-459b-8adc-d6b7664b64db', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T13:11:54.854Z"}', NULL, NULL, '2026-01-15T13:11:55.395'),
  
  ('eede6bb5-d927-4af2-87d3-0dba4cb33dab', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T13:07:46.496Z"}', NULL, NULL, '2026-01-15T13:07:47.058'),
  
  ('ee18ba0f-1b92-4cb5-8302-2481ade89b4d', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T12:28:12.603Z"}', NULL, NULL, '2026-01-15T12:28:13.307'),
  
  ('e6964932-dc9f-46dc-a3f4-fbfb2dc7d831', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T11:57:53.595Z"}', NULL, NULL, '2026-01-15T11:57:53.806'),
  
  ('d408ee95-9617-41e6-9aa6-dad1bbdfaefb', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T10:53:52.478Z"}', NULL, NULL, '2026-01-15T10:53:53.202'),
  
  ('71baacfc-1f2c-469c-9cb9-d0a0f660949c', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T10:13:57.614Z"}', NULL, NULL, '2026-01-15T10:13:57.864'),
  
  ('aa5684f4-5cc0-401d-88f9-f07b7eaf210b', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T10:13:09.410Z"}', NULL, NULL, '2026-01-15T10:13:09.936'),
  
  ('75954c02-ce79-4a08-af2e-c0c90198a0a0', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T09:29:47.057Z"}', NULL, NULL, '2026-01-15T09:29:47.798'),
  
  ('15167236-4672-4f2f-971c-790906c4dfe7', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T08:53:38.438Z"}', NULL, NULL, '2026-01-15T08:53:38.619');
GO

PRINT 'Sample audit_logs inserted (10 of 3166 rows)';
GO

-- =============================================
-- INSTRUÇÃO PARA EXPORTAR DADOS COMPLETOS
-- =============================================
-- 
-- OPÇÃO 1: Usar o script Node.js
-- ----------------------------------------
-- node scripts/generate-sqlserver-inserts-with-json.js
-- 
-- Este script gera INSERTs com todos os campos JSON formatados.
--
-- OPÇÃO 2: Exportar via Supabase SQL Editor
-- ----------------------------------------
-- Execute esta query no Supabase SQL Editor:
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
-- Exporte como CSV e importe via BULK INSERT:
--
-- BULK INSERT [dbo].[audit_logs]
-- FROM 'C:\path\to\audit_logs.csv'
-- WITH (
--   FORMAT = 'CSV',
--   FIELDQUOTE = '"',
--   FIRSTROW = 2,
--   CODEPAGE = '65001',
--   TABLOCK
-- );
--
-- =============================================

-- =============================================
-- SCHEMA DE REFERÊNCIA
-- =============================================
-- Colunas com campos JSON (NVARCHAR(MAX)):
--
-- [old_values] - JSON com valores antes da modificação
--   Exemplo: {"status": "draft", "price": 1000}
--
-- [new_values] - JSON com valores após a modificação
--   Exemplo: {"status": "approved", "price": 1200}
--
-- [metadata] - JSON com informações do evento
--   Exemplo: {"event": "SIGNED_IN", "timestamp": "2026-01-15T10:00:00Z"}
--
-- =============================================
-- Para parsear JSON no SQL Server 2016+:
--
-- SELECT 
--   id,
--   action,
--   JSON_VALUE(metadata, '$.event') as event_type,
--   JSON_VALUE(metadata, '$.timestamp') as event_timestamp
-- FROM audit_logs
-- WHERE ISJSON(metadata) = 1;
--
-- -- Comparar valores antigos vs novos
-- SELECT 
--   id,
--   table_name,
--   JSON_VALUE(old_values, '$.status') as old_status,
--   JSON_VALUE(new_values, '$.status') as new_status
-- FROM audit_logs
-- WHERE old_values IS NOT NULL 
--   AND new_values IS NOT NULL
--   AND ISJSON(old_values) = 1
--   AND ISJSON(new_values) = 1;
-- =============================================

-- Done!
