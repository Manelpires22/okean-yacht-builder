-- ============================================
-- OKEAN CPQ - SQL Server Migration
-- Table: memorial_items
-- Total Records: 2001
-- ============================================

-- IMPORTANT: This file contains only instructions.
-- The full migration with 2001 records is generated dynamically via Edge Function.

-- ============================================
-- HOW TO GENERATE THE COMPLETE MIGRATION
-- ============================================

-- Option 1: Use the Edge Function (RECOMMENDED)
-- ---------------------------------------------
-- Call the edge function to download the complete SQL file:
-- 
-- curl -X GET "https://qqxhkaowexieednyazwq.supabase.co/functions/v1/generate-memorial-items-sql" \
--   -H "Authorization: Bearer YOUR_ANON_KEY" \
--   -o sqlserver-migration-memorial-items-complete.sql
--
-- Or access directly in browser (no auth needed):
-- https://qqxhkaowexieednyazwq.supabase.co/functions/v1/generate-memorial-items-sql
--
-- The file will be downloaded automatically with all 2001 records.

-- Option 2: Use the Node.js script
-- --------------------------------
-- Run: node scripts/generate-sqlserver-inserts-with-json.js

-- ============================================
-- TABLE SCHEMA REFERENCE
-- ============================================

-- memorial_items table structure:
-- id                      UNIQUEIDENTIFIER PRIMARY KEY
-- yacht_model_id          UNIQUEIDENTIFIER NOT NULL
-- code                    NVARCHAR(100)
-- category                NVARCHAR(100) NOT NULL
-- category_id             UNIQUEIDENTIFIER NOT NULL
-- item_name               NVARCHAR(500) NOT NULL
-- description             NVARCHAR(MAX)
-- brand                   NVARCHAR(200)
-- model                   NVARCHAR(200)
-- quantity                INT
-- unit                    NVARCHAR(50)
-- display_order           INT DEFAULT 0
-- category_display_order  INT
-- is_customizable         BIT DEFAULT 1
-- is_configurable         BIT DEFAULT 0
-- is_active               BIT DEFAULT 1
-- job_stop_id             UNIQUEIDENTIFIER
-- image_url               NVARCHAR(MAX)
-- images                  NVARCHAR(MAX) -- JSON array
-- technical_specs         NVARCHAR(MAX) -- JSON object
-- configurable_sub_items  NVARCHAR(MAX) -- JSON array
-- has_upgrades            BIT DEFAULT 0
-- created_at              DATETIME2 DEFAULT GETDATE()
-- updated_at              DATETIME2 DEFAULT GETDATE()
-- created_by              UNIQUEIDENTIFIER

-- ============================================
-- JSON FIELDS USAGE IN SQL SERVER
-- ============================================

-- To parse JSON fields, use OPENJSON:
-- 
-- SELECT 
--   mi.id,
--   mi.item_name,
--   img.value AS image_url
-- FROM memorial_items mi
-- CROSS APPLY OPENJSON(mi.images) img
-- WHERE mi.images IS NOT NULL AND mi.images != '[]';

-- To extract specific JSON values:
-- SELECT 
--   id,
--   item_name,
--   JSON_VALUE(technical_specs, '$.weight') AS weight
-- FROM memorial_items
-- WHERE technical_specs IS NOT NULL;

-- ============================================
-- SAMPLE INSERT FORMAT
-- ============================================

-- The generated SQL uses this format:
/*
INSERT INTO memorial_items (
  id, yacht_model_id, code, category, category_id, item_name, description,
  brand, model, quantity, unit, display_order, category_display_order,
  is_customizable, is_configurable, is_active, job_stop_id, image_url,
  images, technical_specs, configurable_sub_items, has_upgrades,
  created_at, updated_at, created_by
) VALUES (
  N'4b683ff3-217d-4dcb-931c-6196a6ae5ef8',
  N'00475e39-18eb-4730-9399-536572b37163',
  NULL,
  N'banheiro_hospedes_compartilhado',
  N'6ead5028-48cb-410b-a86b-f3e5b6522872',
  N'Descarga a vácuo no vaso sanitário.',
  N'Padrão',
  NULL,
  NULL,
  1,
  N'unidade',
  43,
  1,
  1,
  0,
  1,
  NULL,
  NULL,
  N'[]',
  NULL,
  N'[]',
  0,
  '2025-10-24 18:47:40.018',
  '2025-10-24 19:33:47.075',
  NULL
);
*/

-- ============================================
-- BULK IMPORT ALTERNATIVE
-- ============================================

-- If you prefer CSV import:
-- 1. Export from Supabase SQL Editor:
--
-- SELECT 
--   id, yacht_model_id, code, category, category_id,
--   item_name, description, brand, model, quantity, unit,
--   display_order, category_display_order,
--   is_customizable, is_configurable, is_active,
--   job_stop_id, image_url, 
--   COALESCE(images::text, '[]') as images,
--   technical_specs::text as technical_specs,
--   COALESCE(configurable_sub_items::text, '[]') as configurable_sub_items,
--   has_upgrades, created_at, updated_at, created_by
-- FROM memorial_items
-- ORDER BY yacht_model_id, category_display_order, display_order;
--
-- 2. Import via BULK INSERT:
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

-- ============================================
-- STATISTICS
-- ============================================
-- Total Records: 2001
-- Last Updated: 2026-01-20
-- Edge Function: generate-memorial-items-sql

SET NOCOUNT ON;
GO

PRINT 'Memorial Items Migration Instructions';
PRINT '=====================================';
PRINT 'Total Records: 2001';
PRINT '';
PRINT 'To generate the complete SQL file with all records:';
PRINT 'Access: https://qqxhkaowexieednyazwq.supabase.co/functions/v1/generate-memorial-items-sql';
PRINT '';
PRINT 'The file will be downloaded automatically.';
GO
