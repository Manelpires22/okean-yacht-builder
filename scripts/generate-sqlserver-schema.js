/**
 * Script para gerar schema SQL Server a partir do Supabase PostgreSQL
 * 
 * Uso:
 *   node scripts/generate-sqlserver-schema.js
 * 
 * Requer variáveis de ambiente:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qqxhkaowexieednyazwq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não definida');
  console.log('   Execute: export SUPABASE_SERVICE_ROLE_KEY="sua-chave"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================
// MAPEAMENTO DE TIPOS PostgreSQL -> SQL Server
// ============================================================

const TYPE_MAP = {
  'uuid': 'UNIQUEIDENTIFIER',
  'text': 'NVARCHAR(MAX)',
  'character varying': 'NVARCHAR',
  'varchar': 'NVARCHAR',
  'boolean': 'BIT',
  'bool': 'BIT',
  'numeric': 'DECIMAL(18,2)',
  'decimal': 'DECIMAL(18,2)',
  'integer': 'INT',
  'int4': 'INT',
  'bigint': 'BIGINT',
  'int8': 'BIGINT',
  'smallint': 'SMALLINT',
  'int2': 'SMALLINT',
  'real': 'REAL',
  'float4': 'REAL',
  'double precision': 'FLOAT',
  'float8': 'FLOAT',
  'timestamp with time zone': 'DATETIMEOFFSET',
  'timestamptz': 'DATETIMEOFFSET',
  'timestamp without time zone': 'DATETIME2',
  'timestamp': 'DATETIME2',
  'date': 'DATE',
  'time with time zone': 'TIME',
  'time without time zone': 'TIME',
  'time': 'TIME',
  'jsonb': 'NVARCHAR(MAX)', // JSON nativo no SQL Server 2016+
  'json': 'NVARCHAR(MAX)',
  'inet': 'VARCHAR(45)', // Para IPv4/IPv6
  'cidr': 'VARCHAR(45)',
  'macaddr': 'VARCHAR(17)',
  'bytea': 'VARBINARY(MAX)',
  'ARRAY': 'NVARCHAR(MAX)', // Armazenar como JSON
  'USER-DEFINED': 'VARCHAR(100)', // ENUMs
};

// ============================================================
// DEFINIÇÃO DE ENUMS DO SISTEMA
// ============================================================

const ENUMS = {
  'app_role': [
    'administrador', 'gerente_comercial', 'comercial', 'producao',
    'financeiro', 'pm_engenharia', 'comprador', 'planejador',
    'broker', 'diretor_comercial', 'backoffice_comercial'
  ],
  'approval_status': ['pending', 'approved', 'rejected'],
  'approval_type': ['commercial', 'technical', 'engineering'],
  'memorial_category': [
    'deck_principal', 'conves_principal', 'plataforma_popa', 'salao',
    'area_jantar', 'lavabo', 'cozinha_galley', 'area_cozinha',
    'comando_principal', 'flybridge', 'lobby_conves_inferior',
    'lobby_tripulacao', 'cabine_master', 'cabine_vip_proa', 'cabine_vip',
    'cabine_hospedes_bombordo', 'cabine_hospedes_boreste', 'cabine_capitao',
    'cabine_tripulacao', 'banheiro_master', 'banheiro_vip',
    'banheiro_hospedes_bombordo', 'banheiro_hospedes_boreste',
    'banheiro_hospedes_compartilhado', 'banheiro_capitao', 'banheiro_tripulacao',
    'sala_maquinas', 'garagem', 'propulsao_controle', 'sistema_estabilizacao',
    'equipamentos_eletronicos', 'sistema_extincao_incendio',
    'sistema_ar_condicionado', 'sistema_bombas_porao', 'sistema_agua_sanitario',
    'eletrica', 'seguranca', 'audiovisual_entretenimento', 'casco_estrutura',
    'caracteristicas_externas', 'outros'
  ],
  'pdf_document_type': ['quotation', 'contract', 'ato', 'simulation', 'contract_summary', 'original_contract'],
  'pdf_template_status': ['draft', 'published', 'archived'],
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Converte tipo PostgreSQL para SQL Server
 */
function convertType(pgType, charMaxLength) {
  // Remover prefixo de array
  const isArray = pgType.endsWith('[]') || pgType === 'ARRAY';
  const baseType = pgType.replace('[]', '').toLowerCase();
  
  if (isArray) {
    return 'NVARCHAR(MAX)'; // Arrays viram JSON
  }
  
  // Verificar tipos conhecidos
  for (const [pgPattern, sqlType] of Object.entries(TYPE_MAP)) {
    if (baseType.includes(pgPattern.toLowerCase())) {
      // Para varchar/character varying, usar o tamanho
      if (sqlType === 'NVARCHAR' && charMaxLength) {
        return `NVARCHAR(${charMaxLength})`;
      }
      return sqlType;
    }
  }
  
  // Tipo desconhecido - usar NVARCHAR(MAX) como fallback
  console.warn(`  ⚠️  Tipo desconhecido: ${pgType} -> usando NVARCHAR(MAX)`);
  return 'NVARCHAR(MAX)';
}

/**
 * Converte default value PostgreSQL para SQL Server
 */
function convertDefault(defaultValue, dataType) {
  if (!defaultValue) return null;
  
  let converted = defaultValue;
  
  // UUID generation
  if (converted.includes('gen_random_uuid()') || converted.includes('uuid_generate_v4()')) {
    return 'NEWID()';
  }
  
  // Timestamp
  if (converted.includes('now()') || converted.includes('CURRENT_TIMESTAMP')) {
    if (dataType.includes('DATETIMEOFFSET')) {
      return 'SYSDATETIMEOFFSET()';
    }
    return 'GETDATE()';
  }
  
  // Boolean
  if (converted === 'true') return '1';
  if (converted === 'false') return '0';
  
  // Remover casting PostgreSQL (::text, ::integer, etc)
  converted = converted.replace(/::\w+(\[\])?/g, '');
  
  // Remover prefixo de tipo para strings
  converted = converted.replace(/^'(.+)'::[\w\s]+$/, "'$1'");
  
  // Arrays vazios
  if (converted === "'{}'") {
    return "'[]'"; // JSON array vazio
  }
  
  // Números
  if (/^-?\d+(\.\d+)?$/.test(converted)) {
    return converted;
  }
  
  // Strings
  if (converted.startsWith("'") && converted.endsWith("'")) {
    return converted;
  }
  
  return null; // Não conseguimos converter
}

/**
 * Gera constraint CHECK para um ENUM
 */
function generateEnumCheck(columnName, enumName) {
  const values = ENUMS[enumName];
  if (!values) return null;
  
  const valuesList = values.map(v => `'${v}'`).join(', ');
  return `CONSTRAINT [CK_${columnName}_enum] CHECK ([${columnName}] IN (${valuesList}))`;
}

// ============================================================
// GERAÇÃO DO SCHEMA
// ============================================================

async function getTableInfo() {
  // Query para obter informações das tabelas
  const { data, error } = await supabase.rpc('get_table_columns_info');
  
  if (error) {
    // Se a função não existir, vamos criar uma query alternativa
    console.log('ℹ️  Usando query direta para information_schema...');
    return await getTableInfoDirect();
  }
  
  return data;
}

async function getTableInfoDirect() {
  // Query direta ao information_schema
  const query = `
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.is_nullable,
      c.column_default,
      c.udt_name
    FROM information_schema.tables t
    JOIN information_schema.columns c 
      ON t.table_name = c.table_name 
      AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `;
  
  // Usando SQL direto não é possível via supabase-js sem função RPC
  // Vamos usar os tipos conhecidos do projeto
  return null;
}

/**
 * Gera o schema SQL Server baseado nos tipos do Supabase
 */
function generateSchemaFromTypes() {
  const tables = {
    // ========== CORE TABLES ==========
    users: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'email', type: 'NVARCHAR(255)', nullable: false },
        { name: 'full_name', type: 'NVARCHAR(255)', nullable: true },
        { name: 'avatar_url', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'department', type: 'NVARCHAR(100)', nullable: true },
        { name: 'phone', type: 'NVARCHAR(50)', nullable: true },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'mfa_enabled', type: 'BIT', nullable: true, default: '0' },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },
    
    user_roles: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'user_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'users', column: 'id' } },
        { name: 'role', type: 'VARCHAR(50)', nullable: false, enum: 'app_role' },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    clients: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'name', type: 'NVARCHAR(255)', nullable: false },
        { name: 'email', type: 'NVARCHAR(255)', nullable: true },
        { name: 'phone', type: 'NVARCHAR(50)', nullable: true },
        { name: 'company', type: 'NVARCHAR(255)', nullable: true },
        { name: 'cpf', type: 'NVARCHAR(20)', nullable: true },
        { name: 'notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'created_by', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'users', column: 'id' } },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: false, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: false, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== YACHT MODELS ==========
    yacht_models: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'name', type: 'NVARCHAR(255)', nullable: false },
        { name: 'code', type: 'NVARCHAR(50)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'base_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'base_delivery_days', type: 'INT', nullable: false, default: '365' },
        { name: 'length_m', type: 'DECIMAL(10,2)', nullable: true },
        { name: 'beam_m', type: 'DECIMAL(10,2)', nullable: true },
        { name: 'draft_m', type: 'DECIMAL(10,2)', nullable: true },
        { name: 'displacement_kg', type: 'DECIMAL(12,2)', nullable: true },
        { name: 'fuel_capacity_l', type: 'DECIMAL(10,2)', nullable: true },
        { name: 'water_capacity_l', type: 'DECIMAL(10,2)', nullable: true },
        { name: 'max_speed_knots', type: 'DECIMAL(6,2)', nullable: true },
        { name: 'cruise_speed_knots', type: 'DECIMAL(6,2)', nullable: true },
        { name: 'cabins', type: 'INT', nullable: true },
        { name: 'guests', type: 'INT', nullable: true },
        { name: 'crew', type: 'INT', nullable: true },
        { name: 'engine_brand', type: 'NVARCHAR(100)', nullable: true },
        { name: 'engine_model', type: 'NVARCHAR(100)', nullable: true },
        { name: 'engine_power_hp', type: 'NVARCHAR(50)', nullable: true },
        { name: 'engine_quantity', type: 'INT', nullable: true },
        { name: 'generator_brand', type: 'NVARCHAR(100)', nullable: true },
        { name: 'generator_model', type: 'NVARCHAR(100)', nullable: true },
        { name: 'generator_power_kw', type: 'NVARCHAR(50)', nullable: true },
        { name: 'hero_image_url', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'gallery_images', type: 'NVARCHAR(MAX)', nullable: true }, // JSON array
        { name: 'display_order', type: 'INT', nullable: true, default: '0' },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== MEMORIAL ==========
    memorial_categories: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'value', type: 'VARCHAR(100)', nullable: false },
        { name: 'label', type: 'NVARCHAR(255)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'icon', type: 'NVARCHAR(50)', nullable: true },
        { name: 'display_order', type: 'INT', nullable: false },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    memorial_items: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'category_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'memorial_categories', column: 'id' } },
        { name: 'category', type: 'VARCHAR(100)', nullable: false, enum: 'memorial_category' },
        { name: 'item_name', type: 'NVARCHAR(500)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'brand', type: 'NVARCHAR(100)', nullable: true },
        { name: 'model', type: 'NVARCHAR(100)', nullable: true },
        { name: 'code', type: 'NVARCHAR(50)', nullable: true },
        { name: 'quantity', type: 'INT', nullable: true },
        { name: 'unit', type: 'NVARCHAR(20)', nullable: true },
        { name: 'image_url', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'images', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'technical_specs', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'configurable_sub_items', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'is_configurable', type: 'BIT', nullable: true, default: '0' },
        { name: 'is_customizable', type: 'BIT', nullable: true, default: '0' },
        { name: 'has_upgrades', type: 'BIT', nullable: true, default: '0' },
        { name: 'display_order', type: 'INT', nullable: false, default: '0' },
        { name: 'category_display_order', type: 'INT', nullable: true },
        { name: 'job_stop_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'job_stops', column: 'id' } },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'created_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    memorial_upgrades: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'memorial_item_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'memorial_items', column: 'id' } },
        { name: 'code', type: 'NVARCHAR(50)', nullable: false },
        { name: 'name', type: 'NVARCHAR(500)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'brand', type: 'NVARCHAR(100)', nullable: true },
        { name: 'model', type: 'NVARCHAR(100)', nullable: true },
        { name: 'price', type: 'DECIMAL(18,2)', nullable: false, default: '0' },
        { name: 'cost', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'delivery_days_impact', type: 'INT', nullable: true },
        { name: 'image_url', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'images', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'technical_specs', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'configurable_sub_items', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'is_configurable', type: 'BIT', nullable: true, default: '0' },
        { name: 'is_customizable', type: 'BIT', nullable: true, default: '0' },
        { name: 'allow_multiple', type: 'BIT', nullable: true, default: '0' },
        { name: 'display_order', type: 'INT', nullable: true },
        { name: 'job_stop_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'job_stops', column: 'id' } },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'created_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== OPTIONS ==========
    options: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'category_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'memorial_categories', column: 'id' } },
        { name: 'code', type: 'NVARCHAR(50)', nullable: false },
        { name: 'name', type: 'NVARCHAR(500)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'brand', type: 'NVARCHAR(100)', nullable: true },
        { name: 'model', type: 'NVARCHAR(100)', nullable: true },
        { name: 'base_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'cost', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'delivery_days_impact', type: 'INT', nullable: true },
        { name: 'image_url', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'images', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'technical_specifications', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'configurable_sub_items', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'is_configurable', type: 'BIT', nullable: true, default: '0' },
        { name: 'is_customizable', type: 'BIT', nullable: true, default: '0' },
        { name: 'allow_multiple', type: 'BIT', nullable: true, default: '0' },
        { name: 'job_stop_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'job_stops', column: 'id' } },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'created_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== JOB STOPS ==========
    job_stops: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'item_name', type: 'NVARCHAR(255)', nullable: false },
        { name: 'stage', type: 'NVARCHAR(100)', nullable: true },
        { name: 'days_limit', type: 'INT', nullable: true },
        { name: 'display_order', type: 'INT', nullable: false },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== HULL NUMBERS ==========
    hull_numbers: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'hull_number', type: 'NVARCHAR(50)', nullable: false },
        { name: 'brand', type: 'NVARCHAR(100)', nullable: false, default: "'OKEAN'" },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, default: "'available'" },
        { name: 'contract_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'hull_entry_date', type: 'DATE', nullable: false },
        { name: 'estimated_delivery_date', type: 'DATE', nullable: false },
        { name: 'barco_aberto_date', type: 'DATE', nullable: true },
        { name: 'barco_fechado_date', type: 'DATE', nullable: true },
        { name: 'fechamento_convesdeck_date', type: 'DATE', nullable: true },
        { name: 'teste_piscina_date', type: 'DATE', nullable: true },
        { name: 'teste_mar_date', type: 'DATE', nullable: true },
        { name: 'entrega_comercial_date', type: 'DATE', nullable: true },
        { name: 'job_stop_1_date', type: 'DATE', nullable: true },
        { name: 'job_stop_2_date', type: 'DATE', nullable: true },
        { name: 'job_stop_3_date', type: 'DATE', nullable: true },
        { name: 'job_stop_4_date', type: 'DATE', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== QUOTATIONS ==========
    quotations: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'quotation_number', type: 'NVARCHAR(50)', nullable: false },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'client_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'clients', column: 'id' } },
        { name: 'client_name', type: 'NVARCHAR(255)', nullable: false },
        { name: 'client_email', type: 'NVARCHAR(255)', nullable: true },
        { name: 'client_phone', type: 'NVARCHAR(50)', nullable: true },
        { name: 'hull_number_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'hull_numbers', column: 'id' } },
        { name: 'sales_representative_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'users', column: 'id' } },
        { name: 'simulation_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'base_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'base_discount_percentage', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'final_base_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'total_options_price', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'options_discount_percentage', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'final_options_price', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'total_customizations_price', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'discount_percentage', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'discount_amount', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'final_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'base_delivery_days', type: 'INT', nullable: false },
        { name: 'total_delivery_days', type: 'INT', nullable: false },
        { name: 'status', type: 'VARCHAR(50)', nullable: false },
        { name: 'valid_until', type: 'DATE', nullable: false },
        { name: 'secure_token', type: 'NVARCHAR(100)', nullable: true },
        { name: 'sent_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'accepted_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'accepted_by_name', type: 'NVARCHAR(255)', nullable: true },
        { name: 'accepted_by_email', type: 'NVARCHAR(255)', nullable: true },
        { name: 'version', type: 'INT', nullable: true, default: '1' },
        { name: 'parent_quotation_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'snapshot_json', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    quotation_options: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'quotation_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'quotations', column: 'id' } },
        { name: 'option_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'options', column: 'id' } },
        { name: 'quantity', type: 'INT', nullable: true, default: '1' },
        { name: 'unit_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'total_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'delivery_days_impact', type: 'INT', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    quotation_upgrades: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'quotation_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'quotations', column: 'id' } },
        { name: 'upgrade_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'memorial_upgrades', column: 'id' } },
        { name: 'memorial_item_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'memorial_items', column: 'id' } },
        { name: 'price', type: 'DECIMAL(18,2)', nullable: false, default: '0' },
        { name: 'delivery_days_impact', type: 'INT', nullable: true },
        { name: 'customization_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    quotation_customizations: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'quotation_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'quotations', column: 'id' } },
        { name: 'option_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'options', column: 'id' } },
        { name: 'memorial_item_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'memorial_items', column: 'id' } },
        { name: 'ato_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'customization_code', type: 'NVARCHAR(50)', nullable: true },
        { name: 'item_name', type: 'NVARCHAR(500)', nullable: false },
        { name: 'notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'quantity', type: 'INT', nullable: true },
        { name: 'status', type: 'VARCHAR(50)', nullable: true },
        { name: 'workflow_status', type: 'VARCHAR(50)', nullable: false, default: "'pending'" },
        { name: 'additional_cost', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'delivery_impact_days', type: 'INT', nullable: true },
        { name: 'engineering_hours', type: 'INT', nullable: true },
        { name: 'engineering_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'pm_scope', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'pm_final_price', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'pm_final_delivery_impact_days', type: 'INT', nullable: true },
        { name: 'pm_final_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'supply_items', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'supply_cost', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'supply_lead_time_days', type: 'INT', nullable: true },
        { name: 'supply_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'planning_delivery_impact_days', type: 'INT', nullable: true },
        { name: 'planning_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'planning_window_start', type: 'DATE', nullable: true },
        { name: 'required_parts', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'attachments', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'file_paths', type: 'NVARCHAR(MAX)', nullable: true }, // JSON array
        { name: 'workflow_audit', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'reject_reason', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'reviewed_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'reviewed_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'included_in_contract', type: 'BIT', nullable: true, default: '0' },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== CONTRACTS ==========
    contracts: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'contract_number', type: 'NVARCHAR(50)', nullable: false },
        { name: 'quotation_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'quotations', column: 'id' } },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'client_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'clients', column: 'id' } },
        { name: 'hull_number_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'hull_numbers', column: 'id' } },
        { name: 'base_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'base_delivery_days', type: 'INT', nullable: false },
        { name: 'current_total_price', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'current_total_delivery_days', type: 'INT', nullable: false },
        { name: 'base_snapshot', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'status', type: 'VARCHAR(50)', nullable: false, default: "'active'" },
        { name: 'delivery_status', type: 'VARCHAR(50)', nullable: true },
        { name: 'signed_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'signed_by_name', type: 'NVARCHAR(255)', nullable: true },
        { name: 'signed_by_email', type: 'NVARCHAR(255)', nullable: true },
        { name: 'delivered_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'delivered_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'delivery_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'created_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: false, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== ATOs ==========
    additional_to_orders: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'ato_number', type: 'NVARCHAR(50)', nullable: false },
        { name: 'contract_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'contracts', column: 'id' } },
        { name: 'sequence_number', type: 'INT', nullable: false },
        { name: 'title', type: 'NVARCHAR(500)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'status', type: 'VARCHAR(50)', nullable: false, default: "'draft'" },
        { name: 'workflow_status', type: 'VARCHAR(50)', nullable: true },
        { name: 'requires_approval', type: 'BIT', nullable: true, default: '0' },
        { name: 'commercial_approval_status', type: 'VARCHAR(50)', nullable: true },
        { name: 'technical_approval_status', type: 'VARCHAR(50)', nullable: true },
        { name: 'is_reversal', type: 'BIT', nullable: true, default: '0' },
        { name: 'reversal_of_ato_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'original_price_impact', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'price_impact', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'discount_percentage', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'discount_amount', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'delivery_days_impact', type: 'INT', nullable: true },
        { name: 'rejection_reason', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'requested_by', type: 'UNIQUEIDENTIFIER', nullable: false },
        { name: 'requested_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'approved_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'approved_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: false, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    ato_configurations: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'ato_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'additional_to_orders', column: 'id' } },
        { name: 'item_type', type: 'VARCHAR(50)', nullable: false },
        { name: 'item_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'configuration_details', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'original_price', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'calculated_price', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'discount_percentage', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'delivery_impact_days', type: 'INT', nullable: true },
        { name: 'materials', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'sub_items', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'labor_hours', type: 'INT', nullable: true },
        { name: 'labor_cost_per_hour', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'is_reversal', type: 'BIT', nullable: true, default: '0' },
        { name: 'reversal_of_configuration_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'reversal_percentage', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'reversal_reason', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'pm_status', type: 'VARCHAR(50)', nullable: true },
        { name: 'pm_reviewed_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'pm_reviewed_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'pm_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'created_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== SIMULATIONS ==========
    simulations: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'simulation_number', type: 'NVARCHAR(50)', nullable: false },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'yacht_model_name', type: 'NVARCHAR(255)', nullable: false },
        { name: 'yacht_model_code', type: 'NVARCHAR(50)', nullable: false },
        { name: 'client_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'clients', column: 'id' } },
        { name: 'client_name', type: 'NVARCHAR(255)', nullable: false },
        { name: 'quotation_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'faturamento_bruto', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'faturamento_liquido', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'custo_mp_nacional', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'custo_mp_import', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'custo_mp_import_currency', type: 'VARCHAR(10)', nullable: false },
        { name: 'custo_mo_horas', type: 'INT', nullable: false },
        { name: 'custo_mo_valor_hora', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'custo_venda', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'margem_bruta', type: 'DECIMAL(18,2)', nullable: false },
        { name: 'margem_percent', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'usd_rate', type: 'DECIMAL(10,4)', nullable: false },
        { name: 'eur_rate', type: 'DECIMAL(10,4)', nullable: false },
        { name: 'sales_tax_percent', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'tax_import_percent', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'royalties_percent', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'warranty_percent', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'commission_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'commission_name', type: 'NVARCHAR(100)', nullable: false },
        { name: 'commission_type', type: 'VARCHAR(50)', nullable: true },
        { name: 'commission_percent', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'commission_adjustment_factor', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'adjusted_commission_percent', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'customizacoes_estimadas', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'transporte_cost', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'is_exporting', type: 'BIT', nullable: true, default: '0' },
        { name: 'export_country', type: 'NVARCHAR(100)', nullable: true },
        { name: 'export_currency', type: 'VARCHAR(10)', nullable: true },
        { name: 'has_trade_in', type: 'BIT', nullable: true, default: '0' },
        { name: 'trade_in_brand', type: 'NVARCHAR(100)', nullable: true },
        { name: 'trade_in_model', type: 'NVARCHAR(100)', nullable: true },
        { name: 'trade_in_year', type: 'INT', nullable: true },
        { name: 'trade_in_entry_value', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'trade_in_real_value', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'trade_in_depreciation', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'trade_in_operation_cost', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'trade_in_operation_cost_percent', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'trade_in_commission', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'trade_in_commission_percent', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'trade_in_commission_reduction_percent', type: 'DECIMAL(5,2)', nullable: true },
        { name: 'trade_in_total_impact', type: 'DECIMAL(18,2)', nullable: true },
        { name: 'notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'created_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== WORKFLOW ==========
    customization_workflow_steps: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'customization_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'quotation_customizations', column: 'id' } },
        { name: 'step_type', type: 'VARCHAR(50)', nullable: false },
        { name: 'status', type: 'VARCHAR(50)', nullable: true, default: "'pending'" },
        { name: 'assigned_to', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'users', column: 'id' } },
        { name: 'notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'response_data', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'completed_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    ato_workflow_steps: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'ato_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'additional_to_orders', column: 'id' } },
        { name: 'step_type', type: 'VARCHAR(50)', nullable: false },
        { name: 'status', type: 'VARCHAR(50)', nullable: true, default: "'pending'" },
        { name: 'assigned_to', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'users', column: 'id' } },
        { name: 'notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'response_data', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'completed_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== DELIVERY ==========
    contract_delivery_checklist: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'contract_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'contracts', column: 'id' } },
        { name: 'item_type', type: 'VARCHAR(50)', nullable: false },
        { name: 'item_id', type: 'NVARCHAR(100)', nullable: false },
        { name: 'item_name', type: 'NVARCHAR(500)', nullable: false },
        { name: 'item_code', type: 'NVARCHAR(50)', nullable: true },
        { name: 'is_verified', type: 'BIT', nullable: true, default: '0' },
        { name: 'verified_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'verified_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'verification_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'photo_urls', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== CONFIG TABLES ==========
    discount_limits_config: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'limit_type', type: 'VARCHAR(50)', nullable: false },
        { name: 'no_approval_max', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'director_approval_max', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'admin_approval_required_above', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    role_permissions_config: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'role', type: 'VARCHAR(50)', nullable: false, enum: 'app_role' },
        { name: 'permission', type: 'VARCHAR(100)', nullable: false },
        { name: 'is_granted', type: 'BIT', nullable: false, default: '0' },
        { name: 'is_default', type: 'BIT', nullable: false, default: '1' },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    pm_yacht_model_assignments: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'pm_user_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'users', column: 'id' } },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'assigned_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'assigned_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== AUDIT ==========
    audit_logs: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'user_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'user_email', type: 'NVARCHAR(255)', nullable: true },
        { name: 'user_name', type: 'NVARCHAR(255)', nullable: true },
        { name: 'action', type: 'VARCHAR(50)', nullable: false },
        { name: 'table_name', type: 'NVARCHAR(100)', nullable: true },
        { name: 'record_id', type: 'NVARCHAR(100)', nullable: true },
        { name: 'old_values', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'new_values', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'changed_fields', type: 'NVARCHAR(MAX)', nullable: true }, // JSON array
        { name: 'ip_address', type: 'VARCHAR(45)', nullable: true },
        { name: 'user_agent', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'route', type: 'NVARCHAR(255)', nullable: true },
        { name: 'metadata', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: false, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== PDF TEMPLATES ==========
    pdf_templates: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'name', type: 'NVARCHAR(255)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'document_type', type: 'VARCHAR(50)', nullable: false, enum: 'pdf_document_type' },
        { name: 'template_json', type: 'NVARCHAR(MAX)', nullable: false }, // JSON
        { name: 'branding', type: 'NVARCHAR(100)', nullable: true },
        { name: 'is_default', type: 'BIT', nullable: true, default: '0' },
        { name: 'status', type: 'VARCHAR(50)', nullable: true, enum: 'pdf_template_status', default: "'draft'" },
        { name: 'version', type: 'INT', nullable: true, default: '1' },
        { name: 'created_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    pdf_template_versions: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'template_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'pdf_templates', column: 'id' } },
        { name: 'version', type: 'INT', nullable: false },
        { name: 'template_json', type: 'NVARCHAR(MAX)', nullable: false }, // JSON
        { name: 'change_notes', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'changed_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    pdf_generated: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'template_id', type: 'UNIQUEIDENTIFIER', nullable: true, fk: { table: 'pdf_templates', column: 'id' } },
        { name: 'document_type', type: 'VARCHAR(50)', nullable: false, enum: 'pdf_document_type' },
        { name: 'reference_type', type: 'VARCHAR(50)', nullable: true },
        { name: 'reference_id', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'payload', type: 'NVARCHAR(MAX)', nullable: true }, // JSON
        { name: 'pdf_url', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'generated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== MFA ==========
    mfa_recovery_codes: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'user_id', type: 'UNIQUEIDENTIFIER', nullable: false },
        { name: 'code_hash', type: 'NVARCHAR(255)', nullable: false },
        { name: 'used_at', type: 'DATETIMEOFFSET', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== SIMULATOR CONFIG ==========
    simulator_exchange_rates: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'currency', type: 'VARCHAR(10)', nullable: false },
        { name: 'rate', type: 'DECIMAL(10,4)', nullable: false },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    simulator_commissions: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'name', type: 'NVARCHAR(100)', nullable: false },
        { name: 'commission_type', type: 'VARCHAR(50)', nullable: false },
        { name: 'percentage', type: 'DECIMAL(5,2)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    simulator_model_costs: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'yacht_model_id', type: 'UNIQUEIDENTIFIER', nullable: false, fk: { table: 'yacht_models', column: 'id' } },
        { name: 'custo_mp_nacional', type: 'DECIMAL(18,2)', nullable: false, default: '0' },
        { name: 'custo_mp_import', type: 'DECIMAL(18,2)', nullable: false, default: '0' },
        { name: 'custo_mp_import_currency', type: 'VARCHAR(10)', nullable: true, default: "'USD'" },
        { name: 'custo_mo_horas', type: 'INT', nullable: false, default: '0' },
        { name: 'custo_mo_valor_hora', type: 'DECIMAL(18,2)', nullable: false, default: '0' },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    simulator_business_rules: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'rule_key', type: 'VARCHAR(100)', nullable: false },
        { name: 'rule_value', type: 'DECIMAL(10,4)', nullable: false },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    // ========== SYSTEM CONFIG ==========
    system_config: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'key', type: 'VARCHAR(100)', nullable: false },
        { name: 'value', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    workflow_config: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'workflow_type', type: 'VARCHAR(50)', nullable: false },
        { name: 'config_json', type: 'NVARCHAR(MAX)', nullable: false }, // JSON
        { name: 'is_active', type: 'BIT', nullable: true, default: '1' },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },

    workflow_settings: {
      columns: [
        { name: 'id', type: 'UNIQUEIDENTIFIER', nullable: false, default: 'NEWID()', pk: true },
        { name: 'setting_key', type: 'VARCHAR(100)', nullable: false },
        { name: 'setting_value', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'description', type: 'NVARCHAR(MAX)', nullable: true },
        { name: 'updated_by', type: 'UNIQUEIDENTIFIER', nullable: true },
        { name: 'created_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
        { name: 'updated_at', type: 'DATETIMEOFFSET', nullable: true, default: 'SYSDATETIMEOFFSET()' },
      ]
    },
  };

  return tables;
}

/**
 * Gera DDL para uma tabela
 */
function generateTableDDL(tableName, tableInfo) {
  const { columns } = tableInfo;
  
  let ddl = `-- =============================================\n`;
  ddl += `-- TABLE: ${tableName}\n`;
  ddl += `-- =============================================\n`;
  ddl += `CREATE TABLE [dbo].[${tableName}] (\n`;
  
  const columnDefs = [];
  const constraints = [];
  
  for (const col of columns) {
    let colDef = `  [${col.name}] ${col.type}`;
    
    // Nullable
    if (col.nullable === false) {
      colDef += ' NOT NULL';
    } else {
      colDef += ' NULL';
    }
    
    // Default value
    if (col.default) {
      colDef += ` DEFAULT ${col.default}`;
    }
    
    columnDefs.push(colDef);
    
    // Primary key constraint
    if (col.pk) {
      constraints.push(`  CONSTRAINT [PK_${tableName}] PRIMARY KEY CLUSTERED ([${col.name}])`);
    }
    
    // ENUM check constraint
    if (col.enum) {
      const check = generateEnumCheck(col.name, col.enum);
      if (check) {
        constraints.push(`  ${check}`);
      }
    }
  }
  
  ddl += columnDefs.join(',\n');
  
  if (constraints.length > 0) {
    ddl += ',\n' + constraints.join(',\n');
  }
  
  ddl += '\n);\nGO\n\n';
  
  return ddl;
}

/**
 * Gera Foreign Keys separadamente (para evitar problemas de ordem)
 */
function generateForeignKeys(tables) {
  let ddl = `-- =============================================\n`;
  ddl += `-- FOREIGN KEY CONSTRAINTS\n`;
  ddl += `-- =============================================\n\n`;
  
  for (const [tableName, tableInfo] of Object.entries(tables)) {
    for (const col of tableInfo.columns) {
      if (col.fk) {
        ddl += `ALTER TABLE [dbo].[${tableName}]\n`;
        ddl += `  ADD CONSTRAINT [FK_${tableName}_${col.name}]\n`;
        ddl += `  FOREIGN KEY ([${col.name}])\n`;
        ddl += `  REFERENCES [dbo].[${col.fk.table}] ([${col.fk.column}]);\n`;
        ddl += `GO\n\n`;
      }
    }
  }
  
  return ddl;
}

/**
 * Gera índices recomendados
 */
function generateIndexes(tables) {
  let ddl = `-- =============================================\n`;
  ddl += `-- RECOMMENDED INDEXES\n`;
  ddl += `-- =============================================\n\n`;
  
  // Índices para FKs e campos comuns de busca
  const indexDefinitions = [
    { table: 'quotations', columns: ['status'], name: 'IX_quotations_status' },
    { table: 'quotations', columns: ['client_id'], name: 'IX_quotations_client_id' },
    { table: 'quotations', columns: ['yacht_model_id'], name: 'IX_quotations_yacht_model_id' },
    { table: 'quotations', columns: ['quotation_number'], name: 'IX_quotations_number', unique: true },
    { table: 'contracts', columns: ['status'], name: 'IX_contracts_status' },
    { table: 'contracts', columns: ['contract_number'], name: 'IX_contracts_number', unique: true },
    { table: 'additional_to_orders', columns: ['contract_id'], name: 'IX_ato_contract_id' },
    { table: 'additional_to_orders', columns: ['status'], name: 'IX_ato_status' },
    { table: 'memorial_items', columns: ['yacht_model_id'], name: 'IX_memorial_items_yacht_model' },
    { table: 'memorial_items', columns: ['category'], name: 'IX_memorial_items_category' },
    { table: 'options', columns: ['yacht_model_id'], name: 'IX_options_yacht_model' },
    { table: 'hull_numbers', columns: ['status'], name: 'IX_hull_numbers_status' },
    { table: 'hull_numbers', columns: ['yacht_model_id'], name: 'IX_hull_numbers_yacht_model' },
    { table: 'user_roles', columns: ['user_id'], name: 'IX_user_roles_user' },
    { table: 'user_roles', columns: ['role'], name: 'IX_user_roles_role' },
    { table: 'audit_logs', columns: ['created_at'], name: 'IX_audit_logs_created_at' },
    { table: 'audit_logs', columns: ['user_id'], name: 'IX_audit_logs_user' },
    { table: 'audit_logs', columns: ['table_name'], name: 'IX_audit_logs_table' },
  ];
  
  for (const idx of indexDefinitions) {
    if (!tables[idx.table]) continue;
    
    const uniqueStr = idx.unique ? 'UNIQUE ' : '';
    const colList = idx.columns.map(c => `[${c}]`).join(', ');
    ddl += `CREATE ${uniqueStr}INDEX [${idx.name}] ON [dbo].[${idx.table}] (${colList});\n`;
    ddl += `GO\n`;
  }
  
  return ddl + '\n';
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🚀 OKEAN CPQ - Gerador de Schema SQL Server');
  console.log('='.repeat(50));
  console.log('');
  
  // Gerar schema a partir dos tipos conhecidos
  const tables = generateSchemaFromTypes();
  
  console.log(`📊 Tabelas a gerar: ${Object.keys(tables).length}`);
  console.log('');
  
  // Header do arquivo SQL
  let sql = `-- =============================================\n`;
  sql += `-- OKEAN CPQ Database Schema for SQL Server\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Source: Supabase PostgreSQL (qqxhkaowexieednyazwq)\n`;
  sql += `-- =============================================\n\n`;
  sql += `SET ANSI_NULLS ON\nGO\nSET QUOTED_IDENTIFIER ON\nGO\n\n`;
  
  // Gerar ENUMs como comentário de referência
  sql += `-- =============================================\n`;
  sql += `-- ENUM DEFINITIONS (as CHECK constraints)\n`;
  sql += `-- =============================================\n`;
  for (const [enumName, values] of Object.entries(ENUMS)) {
    sql += `-- ${enumName}: ${values.join(', ')}\n`;
  }
  sql += `\n`;
  
  // Gerar DDL para cada tabela
  for (const [tableName, tableInfo] of Object.entries(tables)) {
    sql += generateTableDDL(tableName, tableInfo);
    console.log(`  ✅ ${tableName}`);
  }
  
  // Gerar Foreign Keys
  sql += generateForeignKeys(tables);
  
  // Gerar índices
  sql += generateIndexes(tables);
  
  // Criar diretório de saída
  const outputDir = 'output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Salvar arquivo
  const outputPath = path.join(outputDir, 'okean-sqlserver-schema.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  
  console.log('');
  console.log('='.repeat(50));
  console.log(`✅ Schema gerado com sucesso!`);
  console.log(`📁 Arquivo: ${outputPath}`);
  console.log(`📊 Total de tabelas: ${Object.keys(tables).length}`);
  console.log('');
  console.log('⚠️  ATENÇÃO:');
  console.log('   - Revise o schema antes de executar');
  console.log('   - RLS do PostgreSQL não existe no SQL Server');
  console.log('   - Campos JSONB precisam de queries adaptadas');
  console.log('   - Triggers/Functions precisam ser reescritos em T-SQL');
}

main().catch(console.error);
