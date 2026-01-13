/**
 * OKEAN CPQ - Data Export for SQL Server
 * 
 * Exports all data from Supabase PostgreSQL to SQL Server-compatible formats.
 * Supports CSV export and/or INSERT statements generation.
 * 
 * Usage:
 *   export SUPABASE_URL="https://qqxhkaowexieednyazwq.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *   
 *   node scripts/export-data-for-sqlserver.js                  # CSV only (default)
 *   node scripts/export-data-for-sqlserver.js --format=csv     # CSV only
 *   node scripts/export-data-for-sqlserver.js --format=insert  # INSERT statements only
 *   node scripts/export-data-for-sqlserver.js --format=both    # CSV + INSERT statements
 * 
 * Output:
 *   output/data/*.csv                    - CSV files per table
 *   output/data/*-inserts.sql            - INSERT statements (if --format=insert or both)
 *   output/bulk-import-sqlserver.sql     - BULK INSERT script for SQL Server
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const formatArg = args.find(arg => arg.startsWith('--format='));
const format = formatArg ? formatArg.split('=')[1] : 'csv';

if (!['csv', 'insert', 'both'].includes(format)) {
  console.error('Invalid format. Use: csv, insert, or both');
  process.exit(1);
}

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qqxhkaowexieednyazwq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Usage: export SUPABASE_SERVICE_ROLE_KEY="your-key" && node scripts/export-data-for-sqlserver.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Tables in order of export (respecting foreign key dependencies)
const TABLES_ORDER = [
  // 1. System configuration tables (no dependencies)
  'discount_limits_config',
  'role_permissions_config',
  'option_categories',
  'memorial_categories',
  'job_stops',
  
  // 2. Base tables
  'users',
  'user_roles',
  'clients',
  'yacht_models',
  
  // 3. Model-related tables
  'pm_yacht_model_assignments',
  'hull_numbers',
  'options',
  'memorial_items',
  'memorial_upgrades',
  
  // 4. PDF templates
  'pdf_templates',
  'pdf_template_versions',
  
  // 5. Simulations
  'simulations',
  
  // 6. Quotations
  'quotations',
  'quotation_options',
  'quotation_upgrades',
  'quotation_customizations',
  'customization_workflow_steps',
  
  // 7. Contracts
  'contracts',
  'contract_delivery_checklist',
  
  // 8. ATOs
  'additional_to_orders',
  'ato_configurations',
  'ato_workflow_steps',
  
  // 9. Audit and generated PDFs
  'audit_logs',
  'pdf_generated',
  
  // 10. MFA
  'mfa_recovery_codes',
  
  // 11. Backup tables
  'approvals_backup',
];

// Column type mappings for data conversion
const COLUMN_TYPES = {
  boolean: ['is_active', 'is_default', 'is_granted', 'is_configurable', 'is_customizable', 
            'has_upgrades', 'allow_multiple', 'is_reversal', 'requires_approval',
            'has_trade_in', 'is_exporting', 'is_verified', 'included_in_contract'],
  jsonb: ['metadata', 'old_values', 'new_values', 'request_details', 'snapshot_json',
          'base_snapshot', 'technical_specs', 'technical_specifications', 'images',
          'configurable_sub_items', 'materials', 'sub_items', 'configuration_details',
          'response_data', 'attachments', 'required_parts', 'supply_items', 
          'workflow_audit', 'photo_urls', 'template_json', 'payload'],
  array: ['changed_fields', 'file_paths'],
  timestamp: ['created_at', 'updated_at', 'sent_at', 'accepted_at', 'approved_at',
              'requested_at', 'reviewed_at', 'resolved_at', 'completed_at', 'signed_at',
              'delivered_at', 'verified_at', 'deprecated_at', 'assigned_at', 'used_at',
              'pm_reviewed_at', 'planning_window_start', 'hull_entry_date', 
              'estimated_delivery_date', 'valid_until', 'barco_aberto_date',
              'barco_fechado_date', 'entrega_comercial_date', 'fechamento_convesdeck_date',
              'teste_mar_date', 'teste_piscina_date', 'job_stop_1_date', 'job_stop_2_date',
              'job_stop_3_date', 'job_stop_4_date'],
};

/**
 * Convert a value for SQL Server compatibility
 */
function convertValue(value, columnName) {
  if (value === null || value === undefined) {
    return null;
  }

  // Boolean conversion
  if (COLUMN_TYPES.boolean.includes(columnName)) {
    return value === true || value === 'true' ? 1 : 0;
  }

  // JSONB/JSON conversion
  if (COLUMN_TYPES.jsonb.includes(columnName)) {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  }

  // Array conversion
  if (COLUMN_TYPES.array.includes(columnName)) {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return value;
  }

  // Timestamp conversion (already in ISO format from Supabase)
  if (COLUMN_TYPES.timestamp.includes(columnName)) {
    if (value) {
      // Convert to SQL Server compatible format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().replace('T', ' ').replace('Z', '');
      }
    }
    return value;
  }

  return value;
}

/**
 * Escape a value for CSV
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

/**
 * Escape a value for SQL INSERT statement
 */
function escapeSQL(value, columnName) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  // Boolean - already converted to 1/0
  if (COLUMN_TYPES.boolean.includes(columnName)) {
    return value;
  }

  // Numbers
  if (typeof value === 'number') {
    return value;
  }

  // Strings and JSON
  const str = String(value);
  return "N'" + str.replace(/'/g, "''") + "'";
}

/**
 * Fetch all data from a table with pagination
 */
async function fetchTableData(tableName) {
  const allData = [];
  let offset = 0;
  const pageSize = 1000;
  
  console.log(`  Fetching ${tableName}...`);
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      console.error(`  Error fetching ${tableName}:`, error.message);
      return [];
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    allData.push(...data);
    
    if (data.length < pageSize) {
      break;
    }
    
    offset += pageSize;
  }
  
  console.log(`    Found ${allData.length} rows`);
  return allData;
}

/**
 * Export table data to CSV
 */
function exportToCSV(tableName, data, outputDir) {
  if (data.length === 0) {
    console.log(`    Skipping ${tableName} (no data)`);
    return;
  }

  const columns = Object.keys(data[0]);
  const lines = [];
  
  // Header row
  lines.push(columns.join(','));
  
  // Data rows
  for (const row of data) {
    const values = columns.map(col => {
      const converted = convertValue(row[col], col);
      return escapeCSV(converted);
    });
    lines.push(values.join(','));
  }
  
  const filePath = path.join(outputDir, `${tableName}.csv`);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`    Exported to ${filePath}`);
}

/**
 * Export table data to SQL INSERT statements
 */
function exportToInserts(tableName, data, outputDir) {
  if (data.length === 0) {
    console.log(`    Skipping ${tableName} inserts (no data)`);
    return;
  }

  const columns = Object.keys(data[0]);
  const lines = [];
  
  lines.push(`-- ${tableName} data`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Rows: ${data.length}`);
  lines.push('');
  lines.push(`SET IDENTITY_INSERT [dbo].[${tableName}] OFF;`);
  lines.push('GO');
  lines.push('');
  
  // Generate INSERT statements in batches of 100
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    lines.push(`INSERT INTO [dbo].[${tableName}] (${columns.map(c => `[${c}]`).join(', ')})`);
    lines.push('VALUES');
    
    const valueRows = batch.map((row, idx) => {
      const values = columns.map(col => {
        const converted = convertValue(row[col], col);
        return escapeSQL(converted, col);
      });
      const suffix = idx === batch.length - 1 ? ';' : ',';
      return `  (${values.join(', ')})${suffix}`;
    });
    
    lines.push(...valueRows);
    lines.push('GO');
    lines.push('');
  }
  
  const filePath = path.join(outputDir, `${tableName}-inserts.sql`);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`    Exported INSERTs to ${filePath}`);
}

/**
 * Generate BULK INSERT script for SQL Server
 */
function generateBulkImportScript(tables, outputDir) {
  const lines = [];
  
  lines.push('-- ============================================================');
  lines.push('-- OKEAN CPQ - SQL Server Bulk Import Script');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('-- IMPORTANT: Update the file paths below to match your environment');
  lines.push('-- Replace C:\\okean-data\\ with the actual path where CSV files are located');
  lines.push('');
  lines.push('USE [OkeanCPQ];');
  lines.push('GO');
  lines.push('');
  
  // Disable all foreign key constraints
  lines.push('-- ============================================================');
  lines.push('-- Step 1: Disable all foreign key constraints');
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL";');
  lines.push('GO');
  lines.push('');
  
  // Disable triggers
  lines.push('-- Disable triggers');
  lines.push('EXEC sp_MSforeachtable "ALTER TABLE ? DISABLE TRIGGER ALL";');
  lines.push('GO');
  lines.push('');
  
  // BULK INSERT for each table
  lines.push('-- ============================================================');
  lines.push('-- Step 2: BULK INSERT data from CSV files');
  lines.push('-- ============================================================');
  lines.push('');
  
  for (const tableName of tables) {
    lines.push(`-- ${tableName}`);
    lines.push(`BULK INSERT [dbo].[${tableName}]`);
    lines.push(`FROM 'C:\\okean-data\\${tableName}.csv'`);
    lines.push('WITH (');
    lines.push("    FORMAT = 'CSV',");
    lines.push('    FIRSTROW = 2,');
    lines.push("    FIELDTERMINATOR = ',',");
    lines.push("    ROWTERMINATOR = '\\n',");
    lines.push("    CODEPAGE = '65001',  -- UTF-8");
    lines.push('    TABLOCK,');
    lines.push("    ERRORFILE = 'C:\\\\okean-data\\\\errors\\\\${tableName}_errors.log'");
    lines.push(');');
    lines.push('GO');
    lines.push('');
  }
  
  // Re-enable constraints
  lines.push('-- ============================================================');
  lines.push('-- Step 3: Re-enable all foreign key constraints');
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL";');
  lines.push('GO');
  lines.push('');
  
  // Re-enable triggers
  lines.push('-- Re-enable triggers');
  lines.push('EXEC sp_MSforeachtable "ALTER TABLE ? ENABLE TRIGGER ALL";');
  lines.push('GO');
  lines.push('');
  
  // Verify data integrity
  lines.push('-- ============================================================');
  lines.push('-- Step 4: Verify data integrity');
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('DBCC CHECKCONSTRAINTS;');
  lines.push('GO');
  lines.push('');
  
  // Row counts
  lines.push('-- ============================================================');
  lines.push('-- Step 5: Verify row counts');
  lines.push('-- ============================================================');
  lines.push('');
  lines.push("SELECT 'Total rows imported:' AS [Info];");
  lines.push('');
  
  for (const tableName of tables) {
    lines.push(`SELECT '${tableName}' AS [Table], COUNT(*) AS [Rows] FROM [dbo].[${tableName}];`);
  }
  lines.push('GO');
  
  const filePath = path.join(outputDir, '..', 'bulk-import-sqlserver.sql');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`\nGenerated bulk import script: ${filePath}`);
}

/**
 * Generate combined INSERT script (all tables in one file)
 */
function generateCombinedInsertScript(allData, outputDir) {
  const lines = [];
  
  lines.push('-- ============================================================');
  lines.push('-- OKEAN CPQ - SQL Server Data Import (INSERT Statements)');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('USE [OkeanCPQ];');
  lines.push('GO');
  lines.push('');
  lines.push('SET NOCOUNT ON;');
  lines.push('GO');
  lines.push('');
  
  // Disable constraints
  lines.push('-- Disable foreign key constraints');
  lines.push('EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL";');
  lines.push('GO');
  lines.push('');
  
  let totalRows = 0;
  
  for (const tableName of TABLES_ORDER) {
    const data = allData[tableName];
    if (!data || data.length === 0) continue;
    
    totalRows += data.length;
    const columns = Object.keys(data[0]);
    
    lines.push('-- ============================================================');
    lines.push(`-- ${tableName} (${data.length} rows)`);
    lines.push('-- ============================================================');
    lines.push('');
    
    // Generate INSERT statements in batches
    const batchSize = 50;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      lines.push(`INSERT INTO [dbo].[${tableName}] (${columns.map(c => `[${c}]`).join(', ')})`);
      lines.push('VALUES');
      
      const valueRows = batch.map((row, idx) => {
        const values = columns.map(col => {
          const converted = convertValue(row[col], col);
          return escapeSQL(converted, col);
        });
        const suffix = idx === batch.length - 1 ? ';' : ',';
        return `  (${values.join(', ')})${suffix}`;
      });
      
      lines.push(...valueRows);
      lines.push('GO');
      lines.push('');
    }
  }
  
  // Re-enable constraints
  lines.push('-- Re-enable foreign key constraints');
  lines.push('EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL";');
  lines.push('GO');
  lines.push('');
  lines.push(`-- Total rows inserted: ${totalRows}`);
  lines.push('PRINT \'Data import completed successfully!\';');
  lines.push('GO');
  
  const filePath = path.join(outputDir, '..', 'all-data-inserts.sql');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`\nGenerated combined INSERT script: ${filePath}`);
}

/**
 * Main export function
 */
async function main() {
  console.log('============================================================');
  console.log('OKEAN CPQ - Data Export for SQL Server');
  console.log(`Format: ${format}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('============================================================\n');
  
  // Create output directories
  const outputDir = path.join(__dirname, '..', 'output', 'data');
  const errorsDir = path.join(outputDir, 'errors');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(errorsDir)) {
    fs.mkdirSync(errorsDir, { recursive: true });
  }
  
  console.log(`Output directory: ${outputDir}\n`);
  
  // Fetch and export data from each table
  const allData = {};
  const tablesWithData = [];
  
  for (const tableName of TABLES_ORDER) {
    console.log(`\nProcessing: ${tableName}`);
    
    try {
      const data = await fetchTableData(tableName);
      allData[tableName] = data;
      
      if (data.length > 0) {
        tablesWithData.push(tableName);
        
        // Export to CSV
        if (format === 'csv' || format === 'both') {
          exportToCSV(tableName, data, outputDir);
        }
        
        // Export to INSERT statements
        if (format === 'insert' || format === 'both') {
          exportToInserts(tableName, data, outputDir);
        }
      }
    } catch (error) {
      console.error(`  Error processing ${tableName}:`, error.message);
    }
  }
  
  // Generate BULK INSERT script (for CSV imports)
  if (format === 'csv' || format === 'both') {
    generateBulkImportScript(tablesWithData, outputDir);
  }
  
  // Generate combined INSERT script
  if (format === 'insert' || format === 'both') {
    generateCombinedInsertScript(allData, outputDir);
  }
  
  // Summary
  console.log('\n============================================================');
  console.log('EXPORT COMPLETE');
  console.log('============================================================');
  console.log(`Tables processed: ${TABLES_ORDER.length}`);
  console.log(`Tables with data: ${tablesWithData.length}`);
  console.log(`Output directory: ${outputDir}`);
  
  if (format === 'csv' || format === 'both') {
    console.log('\nCSV files generated. To import into SQL Server:');
    console.log('  1. Copy CSV files to SQL Server');
    console.log('  2. Update paths in bulk-import-sqlserver.sql');
    console.log('  3. Run bulk-import-sqlserver.sql');
  }
  
  if (format === 'insert' || format === 'both') {
    console.log('\nINSERT scripts generated. To import into SQL Server:');
    console.log('  1. Run all-data-inserts.sql');
    console.log('  OR run individual *-inserts.sql files in order');
  }
  
  console.log('\nDone!');
}

// Run the export
main().catch(console.error);
