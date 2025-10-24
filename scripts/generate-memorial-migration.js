// Script Node.js para gerar migration SQL do CSV
// Uso: node scripts/generate-memorial-migration.js

const fs = require('fs');
const path = require('path');

// Funções auxiliares
function normalizeModel(model) {
  const match = model.trim().match(/^(FY)(\d+)$/);
  return match ? `${match[1]} ${match[2]}` : model.trim();
}

function escapeSql(text) {
  return text.replace(/'/g, "''");
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const items = [];
  
  // Pular primeiras 3 linhas de header
  let i = 3;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    
    // Parse CSV com suporte a aspas
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);
    
    if (parts.length >= 3 && parts[0].trim()) {
      items.push({
        model: parts[0].trim(),
        category: parts[1].trim(),
        description: parts[2].trim().replace(/^"|"$/g, '')
      });
    }
    
    i++;
  }
  
  return items;
}

// Main
const csvPath = path.join(__dirname, '../supabase/functions/import-memorial-okean/boat_items.csv');
const outputPath = path.join(__dirname, '../supabase/migrations/20251024055000_populate_memorial_complete.sql');

console.log('📖 Lendo CSV...');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

console.log('🔍 Parseando dados...');
const items = parseCSV(csvContent);

console.log(`✅ ${items.length} itens encontrados`);

// Contar por modelo
const byModel = {};
items.forEach(item => {
  const normalized = normalizeModel(item.model);
  byModel[normalized] = (byModel[normalized] || 0) + 1;
});

console.log('\n📊 Distribuição por modelo:');
Object.keys(byModel).sort().forEach(model => {
  console.log(`   - ${model}: ${byModel[model]} itens`);
});

// Gerar SQL
console.log('\n💾 Gerando migration SQL...');

let sql = `-- Migration: Popular memorial_okean com TODOS os itens do CSV
-- Total: ${items.length} itens
-- Distribuição: ${Object.keys(byModel).sort().map(m => `${m}: ${byModel[m]}`).join(', ')}

-- Limpar dados existentes
TRUNCATE TABLE memorial_okean CASCADE;

-- Resetar sequence
ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;

-- Inserir todos os itens
INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES\n`;

const values = items.map(item => {
  const modelo = escapeSql(normalizeModel(item.model));
  const categoria = escapeSql(item.category);
  const descricao = escapeSql(item.description);
  return `  ('${modelo}', '${categoria}', '${descricao}', 'Padrão', 1, true, null)`;
});

sql += values.join(',\n');
sql += ';\n\n';
sql += `-- Total de ${items.length} itens inseridos com sucesso!\n`;

fs.writeFileSync(outputPath, sql, 'utf-8');

console.log(`\n✅ Migration gerada: ${outputPath}`);
console.log(`📝 Total de ${items.length} INSERT statements`);
console.log('\n🚀 Execute a migration no Supabase para popular o banco!');
