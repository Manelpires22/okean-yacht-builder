#!/usr/bin/env node
/**
 * Script para gerar INSERTs SQL Server com campos JSON corretamente formatados
 * 
 * Este script consulta o Supabase e gera arquivos SQL com:
 * - Todos os campos incluídos (especialmente JSON/JSONB)
 * - Strings Unicode (N'...')
 * - JSON convertido para NVARCHAR(MAX)
 * - Escape correto de aspas simples
 * 
 * Uso: node scripts/generate-sqlserver-inserts-with-json.js
 */

const fs = require('fs');
const path = require('path');

// Função para escapar strings SQL Server
function escapeSql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    // JSON: converter para string
    const jsonStr = JSON.stringify(value);
    return `N'${jsonStr.replace(/'/g, "''")}'`;
  }
  // String
  return `N'${String(value).replace(/'/g, "''")}'`;
}

// Função para formatar data ISO para SQL Server
function formatDate(dateStr) {
  if (!dateStr) return 'NULL';
  // Formato ISO compatível com SQL Server
  return `'${dateStr}'`;
}

// Template para memorial_items
function generateMemorialItemsInserts(items) {
  const header = `-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: memorial_items (${items.length} rows) - WITH JSON FIELDS
-- Generated: ${new Date().toISOString().split('T')[0]}
-- =============================================

SET NOCOUNT ON;
GO

-- TRUNCATE TABLE [dbo].[memorial_items]; -- Uncomment to clear existing data
-- GO

`;

  const columns = [
    'id', 'yacht_model_id', 'category', 'category_id', 'category_display_order',
    'item_name', 'description', 'code', 'brand', 'model', 'quantity', 'unit',
    'display_order', 'is_active', 'is_customizable', 'is_configurable',
    'has_upgrades', 'image_url', 'images', 'technical_specs', 'configurable_sub_items',
    'job_stop_id', 'created_by', 'created_at', 'updated_at'
  ];

  let sql = header;
  let batchSize = 100;
  let currentBatch = [];

  items.forEach((item, index) => {
    const values = [
      `'${item.id}'`,
      `'${item.yacht_model_id}'`,
      escapeSql(item.category),
      `'${item.category_id}'`,
      item.category_display_order ?? 'NULL',
      escapeSql(item.item_name),
      escapeSql(item.description),
      item.code ? escapeSql(item.code) : 'NULL',
      item.brand ? escapeSql(item.brand) : 'NULL',
      item.model ? escapeSql(item.model) : 'NULL',
      item.quantity ?? 1,
      item.unit ? escapeSql(item.unit) : 'NULL',
      item.display_order ?? 0,
      item.is_active ? 1 : 0,
      item.is_customizable ? 1 : 0,
      item.is_configurable ? 1 : 0,
      item.has_upgrades ? 1 : 0,
      item.image_url ? escapeSql(item.image_url) : 'NULL',
      item.images ? escapeSql(item.images) : `N'[]'`,
      item.technical_specs ? escapeSql(item.technical_specs) : 'NULL',
      item.configurable_sub_items ? escapeSql(item.configurable_sub_items) : `N'[]'`,
      item.job_stop_id ? `'${item.job_stop_id}'` : 'NULL',
      item.created_by ? `'${item.created_by}'` : 'NULL',
      formatDate(item.created_at),
      formatDate(item.updated_at)
    ];

    currentBatch.push(`  (${values.join(', ')})`);

    if (currentBatch.length >= batchSize || index === items.length - 1) {
      sql += `INSERT INTO [dbo].[memorial_items] ([${columns.join('], [')}])\nVALUES\n`;
      sql += currentBatch.join(',\n');
      sql += ';\nGO\n\n';
      currentBatch = [];
    }
  });

  sql += `\nPRINT 'Inserted ${items.length} memorial_items records';\nGO\n`;
  return sql;
}

// Template para options
function generateOptionsInserts(items) {
  const header = `-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: options (${items.length} rows) - WITH JSON FIELDS
-- Generated: ${new Date().toISOString().split('T')[0]}
-- =============================================

SET NOCOUNT ON;
GO

`;

  const columns = [
    'id', 'code', 'name', 'description', 'base_price', 'cost',
    'category_id', 'yacht_model_id', 'is_active', 'is_customizable', 'is_configurable',
    'image_url', 'images', 'configurable_sub_items', 'technical_specifications',
    'delivery_days_impact', 'allow_multiple', 'brand', 'model', 'job_stop_id',
    'created_at', 'updated_at', 'created_by'
  ];

  let sql = header;
  
  sql += `INSERT INTO [dbo].[options] ([${columns.join('], [')}])\nVALUES\n`;

  const values = items.map((item, index) => {
    const row = [
      `'${item.id}'`,
      escapeSql(item.code),
      escapeSql(item.name),
      item.description ? escapeSql(item.description) : 'NULL',
      item.base_price ?? 0,
      item.cost ?? 'NULL',
      item.category_id ? `'${item.category_id}'` : 'NULL',
      item.yacht_model_id ? `'${item.yacht_model_id}'` : 'NULL',
      item.is_active ? 1 : 0,
      item.is_customizable ? 1 : 0,
      item.is_configurable ? 1 : 0,
      item.image_url ? escapeSql(item.image_url) : 'NULL',
      item.images ? escapeSql(item.images) : `N'[]'`,
      item.configurable_sub_items ? escapeSql(item.configurable_sub_items) : `N'[]'`,
      item.technical_specifications ? escapeSql(item.technical_specifications) : 'NULL',
      item.delivery_days_impact ?? 0,
      item.allow_multiple ? 1 : 0,
      item.brand ? escapeSql(item.brand) : 'NULL',
      item.model ? escapeSql(item.model) : 'NULL',
      item.job_stop_id ? `'${item.job_stop_id}'` : 'NULL',
      formatDate(item.created_at),
      formatDate(item.updated_at),
      item.created_by ? `'${item.created_by}'` : 'NULL'
    ];
    return `  (${row.join(', ')})`;
  });

  sql += values.join(',\n');
  sql += ';\nGO\n';

  return sql;
}

// Template para memorial_upgrades
function generateMemorialUpgradesInserts(items) {
  const header = `-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: memorial_upgrades (${items.length} rows) - WITH JSON FIELDS
-- Generated: ${new Date().toISOString().split('T')[0]}
-- =============================================

SET NOCOUNT ON;
GO

`;

  const columns = [
    'id', 'code', 'name', 'description', 'price', 'cost',
    'yacht_model_id', 'memorial_item_id', 'is_active', 'is_customizable', 'is_configurable',
    'image_url', 'images', 'configurable_sub_items', 'technical_specs',
    'delivery_days_impact', 'allow_multiple', 'brand', 'model', 'job_stop_id',
    'display_order', 'created_at', 'updated_at', 'created_by'
  ];

  let sql = header;
  
  sql += `INSERT INTO [dbo].[memorial_upgrades] ([${columns.join('], [')}])\nVALUES\n`;

  const values = items.map((item, index) => {
    const row = [
      `'${item.id}'`,
      escapeSql(item.code),
      escapeSql(item.name),
      item.description ? escapeSql(item.description) : 'NULL',
      item.price ?? 0,
      item.cost ?? 'NULL',
      item.yacht_model_id ? `'${item.yacht_model_id}'` : 'NULL',
      item.memorial_item_id ? `'${item.memorial_item_id}'` : 'NULL',
      item.is_active ? 1 : 0,
      item.is_customizable ? 1 : 0,
      item.is_configurable ? 1 : 0,
      item.image_url ? escapeSql(item.image_url) : 'NULL',
      item.images ? escapeSql(item.images) : `N'[]'`,
      item.configurable_sub_items ? escapeSql(item.configurable_sub_items) : `N'[]'`,
      item.technical_specs ? escapeSql(item.technical_specs) : 'NULL',
      item.delivery_days_impact ?? 0,
      item.allow_multiple ? 1 : 0,
      item.brand ? escapeSql(item.brand) : 'NULL',
      item.model ? escapeSql(item.model) : 'NULL',
      item.job_stop_id ? `'${item.job_stop_id}'` : 'NULL',
      item.display_order ?? 0,
      formatDate(item.created_at),
      formatDate(item.updated_at),
      item.created_by ? `'${item.created_by}'` : 'NULL'
    ];
    return `  (${row.join(', ')})`;
  });

  sql += values.join(',\n');
  sql += ';\nGO\n';

  return sql;
}

// Template para audit_logs
function generateAuditLogsInserts(items) {
  const header = `-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: audit_logs (${items.length} rows) - WITH JSON FIELDS
-- Generated: ${new Date().toISOString().split('T')[0]}
-- =============================================

SET NOCOUNT ON;
GO

-- NOTA: Por questões de performance, considere usar BULK INSERT
-- para grandes volumes de dados.

`;

  const columns = [
    'id', 'user_id', 'user_email', 'user_name', 'action',
    'table_name', 'record_id', 'old_values', 'new_values',
    'changed_fields', 'metadata', 'route', 'user_agent', 'created_at'
  ];

  let sql = header;
  let batchSize = 100;
  let currentBatch = [];

  items.forEach((item, index) => {
    const values = [
      `'${item.id}'`,
      item.user_id ? `'${item.user_id}'` : 'NULL',
      item.user_email ? escapeSql(item.user_email) : 'NULL',
      item.user_name ? escapeSql(item.user_name) : 'NULL',
      escapeSql(item.action),
      item.table_name ? escapeSql(item.table_name) : 'NULL',
      item.record_id ? escapeSql(item.record_id) : 'NULL',
      item.old_values ? escapeSql(item.old_values) : 'NULL',
      item.new_values ? escapeSql(item.new_values) : 'NULL',
      item.changed_fields ? escapeSql(item.changed_fields) : 'NULL',
      item.metadata ? escapeSql(item.metadata) : 'NULL',
      item.route ? escapeSql(item.route) : 'NULL',
      item.user_agent ? escapeSql(item.user_agent) : 'NULL',
      formatDate(item.created_at)
    ];

    currentBatch.push(`  (${values.join(', ')})`);

    if (currentBatch.length >= batchSize || index === items.length - 1) {
      sql += `INSERT INTO [dbo].[audit_logs] ([${columns.join('], [')}])\nVALUES\n`;
      sql += currentBatch.join(',\n');
      sql += ';\nGO\n\n';
      currentBatch = [];
    }
  });

  sql += `\nPRINT 'Inserted ${items.length} audit_logs records';\nGO\n`;
  return sql;
}

// Template para pdf_templates
function generatePdfTemplatesInserts(items) {
  const header = `-- =============================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: pdf_templates (${items.length} rows) - WITH JSON FIELDS
-- Generated: ${new Date().toISOString().split('T')[0]}
-- =============================================

SET NOCOUNT ON;
GO

`;

  const columns = [
    'id', 'name', 'description', 'document_type', 'template_json',
    'is_default', 'status', 'branding', 'version',
    'created_at', 'updated_at', 'created_by', 'updated_by'
  ];

  let sql = header;
  
  sql += `INSERT INTO [dbo].[pdf_templates] ([${columns.join('], [')}])\nVALUES\n`;

  const values = items.map((item, index) => {
    const row = [
      `'${item.id}'`,
      escapeSql(item.name),
      item.description ? escapeSql(item.description) : 'NULL',
      escapeSql(item.document_type),
      escapeSql(item.template_json),
      item.is_default ? 1 : 0,
      escapeSql(item.status || 'active'),
      item.branding ? escapeSql(item.branding) : 'NULL',
      item.version ?? 1,
      formatDate(item.created_at),
      formatDate(item.updated_at),
      item.created_by ? `'${item.created_by}'` : 'NULL',
      item.updated_by ? `'${item.updated_by}'` : 'NULL'
    ];
    return `  (${row.join(', ')})`;
  });

  sql += values.join(',\n');
  sql += ';\nGO\n';

  return sql;
}

// Instruções de uso
console.log(`
=============================================
 SQL Server INSERT Generator for JSON Fields
=============================================

Este script gera funções auxiliares para criar INSERTs SQL Server.

Para uso completo, você precisa:

1. Exportar dados do Supabase como JSON
2. Executar as funções deste script com os dados
3. Salvar o resultado nos arquivos SQL

Exemplo de uso (após exportar dados via API):

const memorial_items = [/* dados do Supabase */];
const sql = generateMemorialItemsInserts(memorial_items);
fs.writeFileSync('output.sql', sql);

Tabelas suportadas:
- memorial_items (2001 rows) - 3 campos JSON
- options (49 rows) - 3 campos JSON
- memorial_upgrades (17 rows) - 3 campos JSON
- audit_logs (3166 rows) - 3 campos JSON
- pdf_templates (1 row) - 1 campo JSON

Campos JSON formatados:
- images: JSON[] -> NVARCHAR(MAX) com N'[...]'
- configurable_sub_items: JSON -> NVARCHAR(MAX)
- technical_specs/specifications: JSON -> NVARCHAR(MAX)
- template_json: JSON -> NVARCHAR(MAX)
- old_values, new_values, metadata: JSON -> NVARCHAR(MAX)

=============================================
`);

// Exportar funções para uso como módulo
module.exports = {
  escapeSql,
  formatDate,
  generateMemorialItemsInserts,
  generateOptionsInserts,
  generateMemorialUpgradesInserts,
  generateAuditLogsInserts,
  generatePdfTemplatesInserts
};
