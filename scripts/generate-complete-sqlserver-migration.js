/**
 * Script para gerar arquivos SQL Server completos com TODOS os registros
 * Executa queries no Supabase e gera arquivos .sql prontos para rodar
 * 
 * USO: node scripts/generate-complete-sqlserver-migration.js
 * 
 * REQUER: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qqxhkaowexieednyazwq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ ERRO: Defina SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// HELPERS PARA FORMATAÇÃO SQL SERVER
// ============================================

/**
 * Escapa string para SQL Server
 */
function escapeSql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return value.toString();
  if (Array.isArray(value)) return `N'${JSON.stringify(value).replace(/'/g, "''")}'`;
  if (typeof value === 'object') return `N'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `N'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Formata data para SQL Server
 */
function formatDate(dateStr) {
  if (!dateStr) return 'NULL';
  return `'${dateStr}'`;
}

/**
 * Gera header do arquivo SQL
 */
function generateHeader(tableName, recordCount) {
  return `-- ============================================
-- OKEAN CPQ - SQL Server Migration
-- Tabela: ${tableName}
-- Registros: ${recordCount}
-- Gerado em: ${new Date().toISOString()}
-- ============================================
SET NOCOUNT ON;
GO

-- Limpar dados existentes (opcional - descomente se necessário)
-- DELETE FROM [dbo].[${tableName}];
-- GO

`;
}

// ============================================
// GERADOR: audit_logs
// ============================================

async function generateAuditLogs() {
  console.log('📊 Buscando audit_logs...');
  
  const allRecords = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error('❌ Erro ao buscar audit_logs:', error);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allRecords.push(...data);
    console.log(`   Carregados ${allRecords.length} registros...`);
    
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  
  console.log(`✅ Total audit_logs: ${allRecords.length}`);
  
  // Gerar SQL
  let sql = generateHeader('audit_logs', allRecords.length);
  
  // Inserir em batches de 1000
  const insertBatchSize = 1000;
  for (let i = 0; i < allRecords.length; i += insertBatchSize) {
    const batch = allRecords.slice(i, i + insertBatchSize);
    
    sql += `-- Batch ${Math.floor(i / insertBatchSize) + 1} de ${Math.ceil(allRecords.length / insertBatchSize)}\n`;
    sql += `INSERT INTO [dbo].[audit_logs] ([id], [user_id], [user_email], [user_name], [action], [table_name], [record_id], [old_values], [new_values], [metadata], [changed_fields], [route], [ip_address], [user_agent], [created_at])\nVALUES\n`;
    
    const values = batch.map(record => {
      const changedFields = record.changed_fields 
        ? `N'${JSON.stringify(record.changed_fields).replace(/'/g, "''")}'`
        : 'NULL';
      
      return `  (${escapeSql(record.id)}, ${escapeSql(record.user_id)}, ${escapeSql(record.user_email)}, ${escapeSql(record.user_name)}, ${escapeSql(record.action)}, ${escapeSql(record.table_name)}, ${escapeSql(record.record_id)}, ${escapeSql(record.old_values)}, ${escapeSql(record.new_values)}, ${escapeSql(record.metadata)}, ${changedFields}, ${escapeSql(record.route)}, ${escapeSql(record.ip_address)}, ${escapeSql(record.user_agent)}, ${formatDate(record.created_at)})`;
    });
    
    sql += values.join(',\n');
    sql += ';\nGO\n\n';
  }
  
  sql += `-- ============================================
-- Verificação
-- ============================================
SELECT COUNT(*) AS [Total audit_logs] FROM [dbo].[audit_logs];
GO

PRINT 'audit_logs: ${allRecords.length} registros inseridos com sucesso!';
GO
`;
  
  return sql;
}

// ============================================
// GERADOR: memorial_items
// ============================================

async function generateMemorialItems() {
  console.log('📊 Buscando memorial_items...');
  
  const allRecords = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('memorial_items')
      .select('*')
      .order('yacht_model_id', { ascending: true })
      .order('category_display_order', { ascending: true })
      .order('display_order', { ascending: true })
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error('❌ Erro ao buscar memorial_items:', error);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allRecords.push(...data);
    console.log(`   Carregados ${allRecords.length} registros...`);
    
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  
  console.log(`✅ Total memorial_items: ${allRecords.length}`);
  
  // Gerar SQL
  let sql = generateHeader('memorial_items', allRecords.length);
  
  // Inserir em batches de 500 (mais colunas = batches menores)
  const insertBatchSize = 500;
  for (let i = 0; i < allRecords.length; i += insertBatchSize) {
    const batch = allRecords.slice(i, i + insertBatchSize);
    
    sql += `-- Batch ${Math.floor(i / insertBatchSize) + 1} de ${Math.ceil(allRecords.length / insertBatchSize)}\n`;
    sql += `INSERT INTO [dbo].[memorial_items] ([id], [yacht_model_id], [category_id], [category], [item_name], [code], [description], [brand], [model], [quantity], [unit], [display_order], [category_display_order], [is_active], [is_customizable], [is_configurable], [has_upgrades], [image_url], [images], [technical_specs], [configurable_sub_items], [job_stop_id], [created_by], [created_at], [updated_at])\nVALUES\n`;
    
    const values = batch.map(record => {
      return `  (${escapeSql(record.id)}, ${escapeSql(record.yacht_model_id)}, ${escapeSql(record.category_id)}, ${escapeSql(record.category)}, ${escapeSql(record.item_name)}, ${escapeSql(record.code)}, ${escapeSql(record.description)}, ${escapeSql(record.brand)}, ${escapeSql(record.model)}, ${record.quantity || 'NULL'}, ${escapeSql(record.unit)}, ${record.display_order || 0}, ${record.category_display_order || 'NULL'}, ${record.is_active ? 1 : 0}, ${record.is_customizable ? 1 : 0}, ${record.is_configurable ? 1 : 0}, ${record.has_upgrades ? 1 : 0}, ${escapeSql(record.image_url)}, ${escapeSql(record.images)}, ${escapeSql(record.technical_specs)}, ${escapeSql(record.configurable_sub_items)}, ${escapeSql(record.job_stop_id)}, ${escapeSql(record.created_by)}, ${formatDate(record.created_at)}, ${formatDate(record.updated_at)})`;
    });
    
    sql += values.join(',\n');
    sql += ';\nGO\n\n';
  }
  
  sql += `-- ============================================
-- Verificação
-- ============================================
SELECT COUNT(*) AS [Total memorial_items] FROM [dbo].[memorial_items];
GO

PRINT 'memorial_items: ${allRecords.length} registros inseridos com sucesso!';
GO
`;
  
  return sql;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 Iniciando geração de arquivos SQL Server completos...\n');
  
  try {
    // Gerar audit_logs
    const auditLogsSql = await generateAuditLogs();
    const auditLogsPath = path.join(__dirname, '..', 'supabase', 'sqlserver-migration-audit-logs.sql');
    fs.writeFileSync(auditLogsPath, auditLogsSql, 'utf8');
    console.log(`📁 Salvo: ${auditLogsPath}\n`);
    
    // Gerar memorial_items
    const memorialItemsSql = await generateMemorialItems();
    const memorialItemsPath = path.join(__dirname, '..', 'supabase', 'sqlserver-migration-memorial-items.sql');
    fs.writeFileSync(memorialItemsPath, memorialItemsSql, 'utf8');
    console.log(`📁 Salvo: ${memorialItemsPath}\n`);
    
    console.log('✅ Geração completa!');
    console.log('\n📋 Ordem de execução no SQL Server:');
    console.log('   1. sqlserver-migration-complete.sql (DDL + tabelas pequenas)');
    console.log('   2. sqlserver-migration-role-permissions.sql');
    console.log('   3. sqlserver-migration-hull-numbers.sql');
    console.log('   4. sqlserver-migration-memorial-items.sql');
    console.log('   5. sqlserver-migration-audit-logs.sql');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
