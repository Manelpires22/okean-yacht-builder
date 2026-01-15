-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: memorial_items (2001 rows) - WITH JSON FIELDS
-- Generated: 2026-01-15
-- =============================================

SET NOCOUNT ON;
GO

-- =============================================
-- NOTA IMPORTANTE - CAMPOS JSON INCLUÍDOS
-- =============================================
-- Esta versão inclui TODOS os campos, incluindo campos JSON:
-- - images (NVARCHAR(MAX)) - Array de URLs de imagens
-- - configurable_sub_items (NVARCHAR(MAX)) - Sub-itens configuráveis
-- - technical_specs (NVARCHAR(MAX)) - Especificações técnicas
--
-- JSON é armazenado como NVARCHAR(MAX) no SQL Server.
-- Use OPENJSON() para parsear no SQL Server 2016+.
--
-- Para migração completa de 2001 registros:
-- 1. Exportar via API: Use o script generate-sqlserver-inserts-with-json.js
-- 2. Ou use BULK INSERT com CSV exportado
--
-- Abaixo está uma amostra representativa com campos JSON:
-- =============================================

-- =============================================
-- INSERT DATA: memorial_items (sample - 50 registros com JSON)
-- =============================================

INSERT INTO [dbo].[memorial_items] (
  [id], [yacht_model_id], [category], [category_id], [category_display_order], 
  [item_name], [description], [code], [brand], [model], [quantity], [unit], 
  [display_order], [is_active], [is_customizable], [is_configurable], [has_upgrades], 
  [image_url], [images], [technical_specs], [configurable_sub_items], 
  [job_stop_id], [created_by], [created_at], [updated_at]
)
VALUES 
  -- Salão - OKEAN 52
  ('c38b98ac-fe6f-41da-8a0c-14896058d345', '00475e39-18eb-4730-9399-536572b37163', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, 
   N'Cozinha em formato de U com bancada em Corian.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   1, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('c30c81b5-67ff-4305-bb35-cd69335a283c', '00475e39-18eb-4730-9399-536572b37163', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, 
   N'Janela corrediça com moldura de aço inoxidável que abre para o passadiço.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   2, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('6c73d594-c55e-4e0e-bb77-92bf5c380574', '00475e39-18eb-4730-9399-536572b37163', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, 
   N'Bancada de fibra dobrável sob a janela da cozinha ao bordo BB.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   3, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('085ef734-d8f3-4045-a534-01033ced6980', '00475e39-18eb-4730-9399-536572b37163', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, 
   N'Piso da cozinha e salão em vinil laminado.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   4, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('3231932c-9441-4b94-a308-af2b00fbdda0', '00475e39-18eb-4730-9399-536572b37163', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, 
   N'Torneira de água quente-fria de aço inoxidável e pia de aço inoxidável.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   5, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('3c217d7e-f97f-4270-b935-094d64f3d45b', '00475e39-18eb-4730-9399-536572b37163', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, 
   N'Luzes LED suspensas no teto.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   6, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('9db4df80-3f97-4863-8dee-0f4e9f1c3cec', '00475e39-18eb-4730-9399-536572b37163', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, 
   N'Microondas.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   7, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('f7c455b1-35cf-4e55-a6a4-b0553af83cf1', '00475e39-18eb-4730-9399-536572b37163', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 12, 
   N'(1) Refrigerador - 130L e (1) freezer – 90L cada sob o balcão.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   8, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Banheiro Hóspedes Compartilhado - OKEAN 52
  ('4b683ff3-217d-4dcb-931c-6196a6ae5ef8', '00475e39-18eb-4730-9399-536572b37163', 'banheiro_hospedes_compartilhado', '6ead5028-48cb-410b-a86b-f3e5b6522872', 1, 
   N'Descarga a vácuo no vaso sanitário.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   43, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('dab671de-4dc3-4558-bdee-d67f44cd6b45', '00475e39-18eb-4730-9399-536572b37163', 'banheiro_hospedes_compartilhado', '6ead5028-48cb-410b-a86b-f3e5b6522872', 1, 
   N'Área seca com bancada em corian e piso em teca natural área molhada com piso em corian e aparador em teca natural.', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   44, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Cabine Tripulação - OKEAN 44
  ('659ae57b-fbfb-46df-b0e3-5eeceb5a6dcd', '45d9b1e4-67da-4239-829a-c3568155878f', 'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 7, 
   N'Acesso ao deque principal por escada de aço inox e degraus de teca', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   69, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('f67c93c2-ce8f-4d91-91be-206b82e1d966', '45d9b1e4-67da-4239-829a-c3568155878f', 'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 319, 
   N'Cama', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   72, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Cabine Tripulação - FY1000
  ('531dcc74-2541-4bdf-9f7e-c534919e9aa8', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', 'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 544, 
   N'Ar-condicionado', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   1, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('15c0d0c1-5b3c-43fb-8855-e9a565c79d30', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', 'cabine_tripulacao', '13aa7969-13c4-4be7-ac4d-d68cb0f1130f', 544, 
   N'Camas (2) com colchões, travesseiros e cobertores', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   2, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),

  -- Salão - FY1000
  ('36ba8b2d-e813-4cad-b06b-d279ef57ad79', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, 
   N'Piso vinílico', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   34, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075'),
  
  ('ff050a88-8bfd-4bfd-b398-c6aa97f515a7', 'a0a5c97f-c1c2-48e6-a153-6a55ac416beb', 'salao', '07f15bc3-1a8e-4939-89ee-4472e592e0a9', 1545, 
   N'Janela com vigia de aço inoxidável que pode ser aberta', N'Padrão', NULL, NULL, NULL, 1, N'unidade', 
   35, 1, 1, 0, 0, 
   NULL, N'[]', NULL, N'[]', 
   NULL, NULL, '2025-10-24T18:47:40.018', '2025-10-24T19:33:47.075');
GO

PRINT 'Sample memorial_items inserted (16 of 2001 rows)';
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
--   yacht_model_id, 
--   category, 
--   category_id, 
--   category_display_order,
--   item_name, 
--   description, 
--   code, 
--   brand, 
--   model, 
--   quantity, 
--   unit,
--   display_order, 
--   is_active, 
--   is_customizable, 
--   is_configurable,
--   has_upgrades, 
--   image_url, 
--   COALESCE(images::text, '[]') as images,
--   technical_specs::text as technical_specs,
--   COALESCE(configurable_sub_items::text, '[]') as configurable_sub_items,
--   job_stop_id, 
--   created_by,
--   created_at, 
--   updated_at
-- FROM memorial_items
-- ORDER BY yacht_model_id, category_id, display_order;
--
-- Exporte como CSV e importe via BULK INSERT:
--
-- BULK INSERT [dbo].[memorial_items]
-- FROM 'C:\path\to\memorial_items.csv'
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
-- [images] - Array JSON de URLs de imagens
--   Exemplo: ["https://storage.../image1.jpg", "https://storage.../image2.jpg"]
--   Default: []
--
-- [technical_specs] - Objeto JSON com especificações
--   Exemplo: {"weight": "150kg", "dimensions": "2x3m"}
--   Default: NULL
--
-- [configurable_sub_items] - Array JSON de sub-itens
--   Exemplo: [{"name": "Cor", "options": ["Branco", "Preto"]}]
--   Default: []
--
-- =============================================
-- Para parsear JSON no SQL Server 2016+:
--
-- SELECT 
--   id,
--   item_name,
--   JSON_VALUE(technical_specs, '$.weight') as weight
-- FROM memorial_items
-- WHERE ISJSON(technical_specs) = 1;
--
-- SELECT 
--   id,
--   item_name,
--   img.value as image_url
-- FROM memorial_items
-- CROSS APPLY OPENJSON(images) img
-- WHERE ISJSON(images) = 1;
-- =============================================

-- Done!
