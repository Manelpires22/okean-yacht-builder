import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeSql(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') return `N'${JSON.stringify(value).replace(/'/g, "''")}'`
  return `N'${String(value).replace(/'/g, "''")}'`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'NULL'
  return `'${dateStr.replace('T', ' ').substring(0, 23)}'`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all data
    const [optionCategories, memorialCategories, options, memorialUpgrades] = await Promise.all([
      supabase.from('option_categories').select('*').order('display_order'),
      supabase.from('memorial_categories').select('*').order('display_order'),
      supabase.from('options').select('*').order('yacht_model_id, category_id, code'),
      supabase.from('memorial_upgrades').select('*').order('yacht_model_id, memorial_item_id, display_order'),
    ])

    if (optionCategories.error) throw optionCategories.error
    if (memorialCategories.error) throw memorialCategories.error
    if (options.error) throw options.error
    if (memorialUpgrades.error) throw memorialUpgrades.error

    const generatedAt = new Date().toISOString()
    
    let sql = `-- =====================================================
-- OKEAN CPQ - SQL Server Migration: Catalog Tables
-- Generated: ${generatedAt}
-- Tables: option_categories, memorial_categories, options, memorial_upgrades
-- =====================================================

SET NOCOUNT ON;
GO

`

    // =====================================================
    // OPTION_CATEGORIES TABLE SCHEMA + DATA
    // =====================================================
    sql += `-- =====================================================
-- TABLE: option_categories
-- Records: ${optionCategories.data?.length || 0}
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'option_categories')
BEGIN
    CREATE TABLE [dbo].[option_categories] (
        [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [name] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [display_order] INT NOT NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [deprecated_at] DATETIME2 NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_option_categories] PRIMARY KEY ([id])
    );
    
    CREATE INDEX [IX_option_categories_display_order] ON [dbo].[option_categories]([display_order]);
    CREATE INDEX [IX_option_categories_is_active] ON [dbo].[option_categories]([is_active]);
END
GO

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM [dbo].[option_categories];
-- GO

-- Insert data
`

    if (optionCategories.data && optionCategories.data.length > 0) {
      for (const row of optionCategories.data) {
        sql += `INSERT INTO [dbo].[option_categories] ([id], [name], [description], [display_order], [is_active], [deprecated_at], [created_at])
VALUES (${escapeSql(row.id)}, ${escapeSql(row.name)}, ${escapeSql(row.description)}, ${row.display_order}, ${row.is_active ? 1 : 0}, ${formatDate(row.deprecated_at)}, ${formatDate(row.created_at)});
`
      }
    }

    sql += `GO

`

    // =====================================================
    // MEMORIAL_CATEGORIES TABLE SCHEMA + DATA
    // =====================================================
    sql += `-- =====================================================
-- TABLE: memorial_categories
-- Records: ${memorialCategories.data?.length || 0}
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'memorial_categories')
BEGIN
    CREATE TABLE [dbo].[memorial_categories] (
        [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [value] NVARCHAR(100) NOT NULL,
        [label] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [icon] NVARCHAR(50) NULL,
        [display_order] INT NOT NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_memorial_categories] PRIMARY KEY ([id]),
        CONSTRAINT [UQ_memorial_categories_value] UNIQUE ([value])
    );
    
    CREATE INDEX [IX_memorial_categories_display_order] ON [dbo].[memorial_categories]([display_order]);
    CREATE INDEX [IX_memorial_categories_is_active] ON [dbo].[memorial_categories]([is_active]);
END
GO

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM [dbo].[memorial_categories];
-- GO

-- Insert data
`

    if (memorialCategories.data && memorialCategories.data.length > 0) {
      for (const row of memorialCategories.data) {
        sql += `INSERT INTO [dbo].[memorial_categories] ([id], [value], [label], [description], [icon], [display_order], [is_active], [created_at], [updated_at])
VALUES (${escapeSql(row.id)}, ${escapeSql(row.value)}, ${escapeSql(row.label)}, ${escapeSql(row.description)}, ${escapeSql(row.icon)}, ${row.display_order}, ${row.is_active ? 1 : 0}, ${formatDate(row.created_at)}, ${formatDate(row.updated_at)});
`
      }
    }

    sql += `GO

`

    // =====================================================
    // OPTIONS TABLE SCHEMA + DATA
    // =====================================================
    sql += `-- =====================================================
-- TABLE: options
-- Records: ${options.data?.length || 0}
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'options')
BEGIN
    CREATE TABLE [dbo].[options] (
        [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [yacht_model_id] UNIQUEIDENTIFIER NULL,
        [category_id] UNIQUEIDENTIFIER NULL,
        [code] NVARCHAR(100) NOT NULL,
        [name] NVARCHAR(500) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [base_price] DECIMAL(18,2) NOT NULL,
        [cost] DECIMAL(18,2) NULL,
        [delivery_days_impact] INT NULL DEFAULT 0,
        [allow_multiple] BIT NOT NULL DEFAULT 0,
        [is_active] BIT NOT NULL DEFAULT 1,
        [is_configurable] BIT NOT NULL DEFAULT 0,
        [is_customizable] BIT NOT NULL DEFAULT 1,
        [image_url] NVARCHAR(500) NULL,
        [images] NVARCHAR(MAX) NULL,
        [brand] NVARCHAR(100) NULL,
        [model] NVARCHAR(100) NULL,
        [technical_specifications] NVARCHAR(MAX) NULL,
        [configurable_sub_items] NVARCHAR(MAX) NULL,
        [job_stop_id] UNIQUEIDENTIFIER NULL,
        [created_by] UNIQUEIDENTIFIER NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_options] PRIMARY KEY ([id])
    );
    
    CREATE INDEX [IX_options_yacht_model_id] ON [dbo].[options]([yacht_model_id]);
    CREATE INDEX [IX_options_category_id] ON [dbo].[options]([category_id]);
    CREATE INDEX [IX_options_code] ON [dbo].[options]([code]);
    CREATE INDEX [IX_options_is_active] ON [dbo].[options]([is_active]);
END
GO

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM [dbo].[options];
-- GO

-- Insert data
`

    if (options.data && options.data.length > 0) {
      for (const row of options.data) {
        sql += `INSERT INTO [dbo].[options] ([id], [yacht_model_id], [category_id], [code], [name], [description], [base_price], [cost], [delivery_days_impact], [allow_multiple], [is_active], [is_configurable], [is_customizable], [image_url], [images], [brand], [model], [technical_specifications], [configurable_sub_items], [job_stop_id], [created_by], [created_at], [updated_at])
VALUES (${escapeSql(row.id)}, ${escapeSql(row.yacht_model_id)}, ${escapeSql(row.category_id)}, ${escapeSql(row.code)}, ${escapeSql(row.name)}, ${escapeSql(row.description)}, ${row.base_price || 0}, ${row.cost || 'NULL'}, ${row.delivery_days_impact || 0}, ${row.allow_multiple ? 1 : 0}, ${row.is_active ? 1 : 0}, ${row.is_configurable ? 1 : 0}, ${row.is_customizable ? 1 : 0}, ${escapeSql(row.image_url)}, ${escapeSql(row.images)}, ${escapeSql(row.brand)}, ${escapeSql(row.model)}, ${escapeSql(row.technical_specifications)}, ${escapeSql(row.configurable_sub_items)}, ${escapeSql(row.job_stop_id)}, ${escapeSql(row.created_by)}, ${formatDate(row.created_at)}, ${formatDate(row.updated_at)});
`
      }
    }

    sql += `GO

`

    // =====================================================
    // MEMORIAL_UPGRADES TABLE SCHEMA + DATA
    // =====================================================
    sql += `-- =====================================================
-- TABLE: memorial_upgrades
-- Records: ${memorialUpgrades.data?.length || 0}
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'memorial_upgrades')
BEGIN
    CREATE TABLE [dbo].[memorial_upgrades] (
        [id] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [yacht_model_id] UNIQUEIDENTIFIER NOT NULL,
        [memorial_item_id] UNIQUEIDENTIFIER NULL,
        [code] NVARCHAR(100) NOT NULL,
        [name] NVARCHAR(500) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [price] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [cost] DECIMAL(18,2) NULL,
        [delivery_days_impact] INT NULL DEFAULT 0,
        [display_order] INT NULL DEFAULT 0,
        [allow_multiple] BIT NOT NULL DEFAULT 0,
        [is_active] BIT NOT NULL DEFAULT 1,
        [is_configurable] BIT NOT NULL DEFAULT 0,
        [is_customizable] BIT NOT NULL DEFAULT 1,
        [image_url] NVARCHAR(500) NULL,
        [images] NVARCHAR(MAX) NULL,
        [brand] NVARCHAR(100) NULL,
        [model] NVARCHAR(100) NULL,
        [technical_specs] NVARCHAR(MAX) NULL,
        [configurable_sub_items] NVARCHAR(MAX) NULL,
        [job_stop_id] UNIQUEIDENTIFIER NULL,
        [created_by] UNIQUEIDENTIFIER NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT [PK_memorial_upgrades] PRIMARY KEY ([id])
    );
    
    CREATE INDEX [IX_memorial_upgrades_yacht_model_id] ON [dbo].[memorial_upgrades]([yacht_model_id]);
    CREATE INDEX [IX_memorial_upgrades_memorial_item_id] ON [dbo].[memorial_upgrades]([memorial_item_id]);
    CREATE INDEX [IX_memorial_upgrades_code] ON [dbo].[memorial_upgrades]([code]);
    CREATE INDEX [IX_memorial_upgrades_is_active] ON [dbo].[memorial_upgrades]([is_active]);
END
GO

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM [dbo].[memorial_upgrades];
-- GO

-- Insert data
`

    if (memorialUpgrades.data && memorialUpgrades.data.length > 0) {
      for (const row of memorialUpgrades.data) {
        sql += `INSERT INTO [dbo].[memorial_upgrades] ([id], [yacht_model_id], [memorial_item_id], [code], [name], [description], [price], [cost], [delivery_days_impact], [display_order], [allow_multiple], [is_active], [is_configurable], [is_customizable], [image_url], [images], [brand], [model], [technical_specs], [configurable_sub_items], [job_stop_id], [created_by], [created_at], [updated_at])
VALUES (${escapeSql(row.id)}, ${escapeSql(row.yacht_model_id)}, ${escapeSql(row.memorial_item_id)}, ${escapeSql(row.code)}, ${escapeSql(row.name)}, ${escapeSql(row.description)}, ${row.price || 0}, ${row.cost || 'NULL'}, ${row.delivery_days_impact || 0}, ${row.display_order || 0}, ${row.allow_multiple ? 1 : 0}, ${row.is_active ? 1 : 0}, ${row.is_configurable ? 1 : 0}, ${row.is_customizable ? 1 : 0}, ${escapeSql(row.image_url)}, ${escapeSql(row.images)}, ${escapeSql(row.brand)}, ${escapeSql(row.model)}, ${escapeSql(row.technical_specs)}, ${escapeSql(row.configurable_sub_items)}, ${escapeSql(row.job_stop_id)}, ${escapeSql(row.created_by)}, ${formatDate(row.created_at)}, ${formatDate(row.updated_at)});
`
      }
    }

    sql += `GO

-- =====================================================
-- FOREIGN KEY CONSTRAINTS (add after all tables exist)
-- =====================================================

-- Options foreign keys
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_options_yacht_models')
BEGIN
    ALTER TABLE [dbo].[options] ADD CONSTRAINT [FK_options_yacht_models] 
    FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]);
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_options_memorial_categories')
BEGIN
    ALTER TABLE [dbo].[options] ADD CONSTRAINT [FK_options_memorial_categories] 
    FOREIGN KEY ([category_id]) REFERENCES [dbo].[memorial_categories]([id]);
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_options_job_stops')
BEGIN
    ALTER TABLE [dbo].[options] ADD CONSTRAINT [FK_options_job_stops] 
    FOREIGN KEY ([job_stop_id]) REFERENCES [dbo].[job_stops]([id]);
END
GO

-- Memorial upgrades foreign keys
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_memorial_upgrades_yacht_models')
BEGIN
    ALTER TABLE [dbo].[memorial_upgrades] ADD CONSTRAINT [FK_memorial_upgrades_yacht_models] 
    FOREIGN KEY ([yacht_model_id]) REFERENCES [dbo].[yacht_models]([id]);
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_memorial_upgrades_memorial_items')
BEGIN
    ALTER TABLE [dbo].[memorial_upgrades] ADD CONSTRAINT [FK_memorial_upgrades_memorial_items] 
    FOREIGN KEY ([memorial_item_id]) REFERENCES [dbo].[memorial_items]([id]);
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_memorial_upgrades_job_stops')
BEGIN
    ALTER TABLE [dbo].[memorial_upgrades] ADD CONSTRAINT [FK_memorial_upgrades_job_stops] 
    FOREIGN KEY ([job_stop_id]) REFERENCES [dbo].[job_stops]([id]);
END
GO

-- =====================================================
-- SUMMARY
-- =====================================================
/*
Migration Summary:
- option_categories: ${optionCategories.data?.length || 0} records
- memorial_categories: ${memorialCategories.data?.length || 0} records
- options: ${options.data?.length || 0} records
- memorial_upgrades: ${memorialUpgrades.data?.length || 0} records
- Total: ${(optionCategories.data?.length || 0) + (memorialCategories.data?.length || 0) + (options.data?.length || 0) + (memorialUpgrades.data?.length || 0)} records

Execution Order:
1. Execute yacht_models and job_stops migrations first (dependencies)
2. Execute memorial_items migration (for memorial_upgrades FK)
3. Execute THIS script

Foreign Keys added:
- options -> yacht_models, memorial_categories, job_stops
- memorial_upgrades -> yacht_models, memorial_items, job_stops
*/

PRINT 'Catalog migration completed successfully!';
PRINT 'option_categories: ${optionCategories.data?.length || 0} records';
PRINT 'memorial_categories: ${memorialCategories.data?.length || 0} records';
PRINT 'options: ${options.data?.length || 0} records';
PRINT 'memorial_upgrades: ${memorialUpgrades.data?.length || 0} records';
GO
`

    return new Response(sql, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="okean-catalog-migration.sql"',
      },
    })

  } catch (error: unknown) {
    console.error('Error generating SQL:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
