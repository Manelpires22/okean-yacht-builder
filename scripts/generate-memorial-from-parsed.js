#!/usr/bin/env node
/**
 * Gera migration SQL a partir do documento parseado
 * Processa todos os ~1571 registros do Memorial OKEAN
 */

const fs = require('fs');
const path = require('path');

function escapeSql(text) {
  if (!text) return '';
  return String(text).replace(/'/g, "''");
}

async function main() {
  const parsedDocPath = path.join(__dirname, '..', 'tool-results', 'document--parse_document', '20251024-035121-444017');
  const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251024070000_populate_memorial_complete.sql');

  console.log('📖 Lendo documento parseado...');
  
  const content = fs.readFileSync(parsedDocPath, 'utf-8');
  const lines = content.split('\n');

  const items = [];
  const modelsCount = {};

  // Processar linhas da tabela markdown
  for (const line of lines) {
    // Pular headers e separadores
    if (line.startsWith('#') || line.startsWith('|-|') || !line.includes('|')) {
      continue;
    }

    // Parse linha da tabela: |Modelo|Categoria|Descrição|
    const match = line.match(/^\|([^|]+)\|([^|]+)\|([^|]+)\|$/);
    if (!match) continue;

    const modelo = match[1].trim();
    const categoria = match[2].trim();
    const descricao = match[3].trim();

    // Pular header row
    if (modelo === 'Modelo' || categoria === 'Categoria') continue;

    // Validar dados
    if (!modelo || !categoria || !descricao) continue;

    items.push({ modelo, categoria, descricao });
    modelsCount[modelo] = (modelsCount[modelo] || 0) + 1;
  }

  console.log(`✅ ${items.length} itens processados`);
  
  // Estatísticas
  console.log('\n📊 Distribuição por modelo:');
  for (const model of Object.keys(modelsCount).sort()) {
    console.log(`   - ${model}: ${modelsCount[model]} itens`);
  }

  // Gerar SQL
  console.log('\n💾 Gerando migration SQL...');

  const sqlLines = [];
  sqlLines.push(`-- Migration: Popular memorial_okean com TODOS os ${items.length} itens`);
  sqlLines.push('-- Data: 2025-10-24');
  sqlLines.push('-- Fonte: combined_boat_items.xlsx');
  sqlLines.push('');
  sqlLines.push('-- Limpar dados existentes');
  sqlLines.push('TRUNCATE TABLE memorial_okean CASCADE;');
  sqlLines.push('');
  sqlLines.push('-- Resetar sequence');
  sqlLines.push('ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;');
  sqlLines.push('');

  // Dividir em batches de 500 para evitar statements muito grandes
  const batchSize = 500;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    sqlLines.push('-- Inserir batch de itens');
    sqlLines.push('INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES');
    
    const values = batch.map(item => 
      `  ('${escapeSql(item.modelo)}', '${escapeSql(item.categoria)}', '${escapeSql(item.descricao)}', 'Padrão', 1, true, null)`
    );
    
    sqlLines.push(values.join(',\n'));
    sqlLines.push(';');
    sqlLines.push('');
  }

  sqlLines.push(`-- ✅ Total de ${items.length} itens inseridos!`);
  sqlLines.push(`-- Modelos: ${Object.keys(modelsCount).sort().join(', ')}`);

  // Escrever arquivo
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf-8');

  console.log(`\n✅ Migration gerada: ${outputPath}`);
  console.log(`📝 Total de ${items.length} registros`);
  console.log(`\n🚀 Próximo passo: Migration será executada automaticamente!`);
}

main().catch(console.error);
