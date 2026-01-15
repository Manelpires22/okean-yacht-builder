-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: audit_logs (3178+ rows) - WITH JSON FIELDS
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
-- RECOMENDAÇÃO: Para 3178+ registros, use BULK INSERT
-- =============================================

-- =============================================
-- INSERT DATA: audit_logs (sample - vários tipos com JSON)
-- =============================================

INSERT INTO [dbo].[audit_logs] (
  [id], [user_id], [user_email], [user_name], [action], 
  [table_name], [record_id], [old_values], [new_values], 
  [changed_fields], [metadata], [route], [user_agent], [created_at]
)
VALUES 
  -- LOGIN events com metadata JSON
  ('ea62c3ca-c4dd-4c48-a71f-8bbe40b8fd80', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T13:34:23.542Z"}', NULL, NULL, '2026-01-15T13:34:23.759'),
  
  ('f75cb049-fe01-4ec8-942c-85ffcb5e8379', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T13:34:23.376Z"}', NULL, NULL, '2026-01-15T13:34:23.637'),

  ('a61a6f28-3f15-47db-a33c-3626be28042d', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', NULL, N'LOGIN', 
   NULL, NULL, NULL, NULL, 
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T13:27:12.839Z"}', NULL, NULL, '2026-01-15T13:27:13.394'),

  -- INSERT de cliente com new_values JSON
  ('b6e5018b-ec26-4bf5-91f0-7389e10122e2', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', N'Manuel Macieira Pires', N'INSERT', 
   N'clients', 'cae4ce51-b70c-43a5-8447-ee4bffb57100', NULL, 
   N'{"company":null,"cpf":null,"created_at":"2026-01-14T18:50:17.040961+00:00","created_by":"237c5317-2496-41eb-b24a-337f9c966237","email":null,"id":"cae4ce51-b70c-43a5-8447-ee4bffb57100","name":"Marcelo Ruas","notes":null,"phone":null,"updated_at":"2026-01-14T18:50:17.040961+00:00"}', 
   NULL, N'{}', NULL, NULL, '2026-01-14T18:50:17.040'),

  ('47ae6c44-5c27-4c41-b2d7-8a5de60af946', '237c5317-2496-41eb-b24a-337f9c966237', N'manuel.pires@okeanyachts.com', N'Manuel Macieira Pires', N'INSERT', 
   N'clients', '11ba5d0e-d0f1-48d2-a2f0-39c3107bcf9f', NULL, 
   N'{"company":null,"cpf":null,"created_at":"2026-01-14T12:47:10.066791+00:00","created_by":"237c5317-2496-41eb-b24a-337f9c966237","email":"sbonetti@uol.com.br","id":"11ba5d0e-d0f1-48d2-a2f0-39c3107bcf9f","name":"Stefano Bonetti","notes":null,"phone":"+55-41-99934-0707","updated_at":"2026-01-14T12:47:10.066791+00:00"}', 
   NULL, N'{}', NULL, NULL, '2026-01-14T12:47:10.066'),

  -- INSERT de user_roles com new_values JSON
  ('942f0feb-fa27-4585-b201-609eb6b67f0b', NULL, NULL, NULL, N'INSERT', 
   N'user_roles', 'b61cb10d-3715-4ab3-8a7e-ce8bc87ca03b', NULL, 
   N'{"created_at":"2026-01-13T01:58:19.787585+00:00","id":"b61cb10d-3715-4ab3-8a7e-ce8bc87ca03b","role":"administrador","user_id":"ab3f0582-765d-4dcf-a30a-7f0141779e0a"}', 
   NULL, N'{}', NULL, NULL, '2026-01-13T01:58:19.787'),

  -- INSERT de usuário com new_values JSON
  ('547f0b88-2814-4627-8a9c-290b89d33a23', NULL, NULL, NULL, N'INSERT', 
   N'users', 'ab3f0582-765d-4dcf-a30a-7f0141779e0a', NULL, 
   N'{"created_at":"2026-01-13T01:58:19.610393+00:00","department":"Produção","email":"nercio.fernandes@okeanyachts.com","full_name":"Nercio Fernandes","id":"ab3f0582-765d-4dcf-a30a-7f0141779e0a","is_active":true,"updated_at":"2026-01-13T01:58:19.610393+00:00"}', 
   NULL, N'{}', NULL, NULL, '2026-01-13T01:58:19.610'),

  -- DELETE com old_values JSON
  ('49495099-a6a8-49ea-8a2e-89167c331d43', NULL, NULL, NULL, N'DELETE', 
   N'user_roles', '3ef66d59-a07a-4bcc-80b1-937af8a0f06f', 
   N'{"created_at":"2026-01-13T01:54:06.217475+00:00","id":"3ef66d59-a07a-4bcc-80b1-937af8a0f06f","role":"administrador","user_id":"237c5317-2496-41eb-b24a-337f9c966237"}', 
   NULL, NULL, N'{}', NULL, NULL, '2026-01-13T01:57:40.415'),

  ('2b80ea98-c2a9-4c27-832c-c946c6d7394a', NULL, NULL, NULL, N'DELETE', 
   N'user_roles', '36aa1501-36d5-4773-9359-e76d19e28aa2', 
   N'{"created_at":"2026-01-13T01:54:06.217475+00:00","id":"36aa1501-36d5-4773-9359-e76d19e28aa2","role":"diretor_comercial","user_id":"237c5317-2496-41eb-b24a-337f9c966237"}', 
   NULL, NULL, N'{}', NULL, NULL, '2026-01-13T01:57:40.415'),

  -- UPDATE com old_values e new_values JSON
  ('00480522-a75a-4ca8-b6b2-abf00348ae89', NULL, NULL, NULL, N'UPDATE', 
   N'users', '237c5317-2496-41eb-b24a-337f9c966237', 
   N'{"created_at":"2025-10-24T23:42:45.703357+00:00","department":"Comercial","email":"manuel.pires@okeanyachts.com","full_name":"Manuel Macieira Pires","id":"237c5317-2496-41eb-b24a-337f9c966237","is_active":true,"updated_at":"2026-01-13T01:54:06.217475+00:00"}', 
   N'{"created_at":"2025-10-24T23:42:45.703357+00:00","department":"Comercial","email":"manuel.pires@okeanyachts.com","full_name":"Manuel Macieira Pires","id":"237c5317-2496-41eb-b24a-337f9c966237","is_active":true,"updated_at":"2026-01-13T01:57:40.143+00:00"}', 
   N'["updated_at"]', N'{}', NULL, NULL, '2026-01-13T01:57:40.240'),

  -- Mais LOGIN events
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
   NULL, N'{"event":"SIGNED_IN","timestamp":"2026-01-15T09:29:47.057Z"}', NULL, NULL, '2026-01-15T09:29:47.798');
GO

PRINT 'Sample audit_logs inserted (20 of 3178 rows) - includes LOGIN, INSERT, UPDATE, DELETE with JSON';
GO

-- =============================================
-- INSTRUÇÃO PARA EXPORTAR DADOS COMPLETOS
-- =============================================
-- 
-- Para migrar todos os 3178+ registros com campos JSON corretos:
--
-- OPÇÃO 1: Usar script Node.js (RECOMENDADO)
-- -----------------------------------------
-- Execute no terminal:
--   node scripts/generate-sqlserver-inserts-with-json.js audit_logs
-- 
-- O script irá:
-- - Conectar ao Supabase
-- - Buscar todos os registros
-- - Converter campos JSON para NVARCHAR com escape correto
-- - Gerar arquivo SQL com INSERTs
--
-- OPÇÃO 2: Exportar via Supabase SQL Editor
-- -----------------------------------------
-- Execute esta query no Supabase:
/*
SELECT 
  id, user_id, user_email, user_name, action,
  table_name, record_id,
  COALESCE(old_values::text, 'null') as old_values,
  COALESCE(new_values::text, 'null') as new_values,
  changed_fields,
  COALESCE(metadata::text, 'null') as metadata,
  route, user_agent, ip_address::text, created_at
FROM audit_logs
ORDER BY created_at DESC;
*/
-- Exportar como CSV e usar BULK INSERT no SQL Server
--
-- =============================================

-- =============================================
-- SCHEMA REFERENCE - audit_logs
-- =============================================
-- CREATE TABLE [dbo].[audit_logs] (
--   [id] UNIQUEIDENTIFIER NOT NULL,
--   [user_id] UNIQUEIDENTIFIER NULL,
--   [user_email] NVARCHAR(255) NULL,
--   [user_name] NVARCHAR(255) NULL,
--   [action] VARCHAR(50) NOT NULL,
--   [table_name] VARCHAR(100) NULL,
--   [record_id] UNIQUEIDENTIFIER NULL,
--   [old_values] NVARCHAR(MAX) NULL,     -- JSON
--   [new_values] NVARCHAR(MAX) NULL,     -- JSON
--   [changed_fields] NVARCHAR(MAX) NULL, -- JSON array
--   [metadata] NVARCHAR(MAX) NULL,       -- JSON
--   [route] NVARCHAR(500) NULL,
--   [user_agent] NVARCHAR(500) NULL,
--   [ip_address] VARCHAR(45) NULL,
--   [created_at] DATETIMEOFFSET NOT NULL
-- );
-- =============================================

-- =============================================
-- EXEMPLOS DE PARSING JSON NO SQL SERVER
-- =============================================
/*
-- Selecionar eventos de login com timestamp
SELECT 
  id, 
  user_email,
  JSON_VALUE(metadata, '$.event') as event_type,
  JSON_VALUE(metadata, '$.timestamp') as event_timestamp
FROM audit_logs 
WHERE action = 'LOGIN' AND ISJSON(metadata) = 1;

-- Selecionar INSERTs de clientes com dados
SELECT 
  id,
  JSON_VALUE(new_values, '$.name') as client_name,
  JSON_VALUE(new_values, '$.email') as client_email,
  JSON_VALUE(new_values, '$.phone') as client_phone
FROM audit_logs 
WHERE action = 'INSERT' AND table_name = 'clients' AND ISJSON(new_values) = 1;

-- Comparar valores antes/depois em UPDATEs
SELECT 
  id,
  table_name,
  JSON_VALUE(old_values, '$.updated_at') as old_updated_at,
  JSON_VALUE(new_values, '$.updated_at') as new_updated_at
FROM audit_logs 
WHERE action = 'UPDATE' AND ISJSON(old_values) = 1 AND ISJSON(new_values) = 1;

-- Contagem por tipo de ação
SELECT action, COUNT(*) as total 
FROM audit_logs 
GROUP BY action 
ORDER BY total DESC;
*/
-- =============================================
