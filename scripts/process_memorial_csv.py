#!/usr/bin/env python3
"""
Script para processar boat_items.csv e gerar migration SQL completa
Resolve problemas de parsing, normaliza modelos e escapa SQL corretamente
"""

import csv
import re

def normalize_model(model):
    """Normaliza FY550 → FY 550"""
    match = re.match(r'^(FY)(\d+)$', model.strip())
    if match:
        return f'{match.group(1)} {match.group(2)}'
    return model.strip()

def escape_sql(text):
    """Escapa aspas simples para SQL"""
    return text.replace("'", "''")

def main():
    csv_file = '../supabase/functions/import-memorial-okean/boat_items.csv'
    output_file = '../supabase/migrations/20251024050000_populate_memorial_okean_all_data.sql'
    
    items = []
    
    # Parse CSV (pula as 3 primeiras linhas de header)
    with open(csv_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()[3:]  # Pular header lines
        
        reader = csv.reader(lines, delimiter=',', quotechar='"')
        for row in reader:
            if len(row) >= 3 and row[0].strip():
                model = normalize_model(row[0])
                category = row[1].strip()
                description = row[2].strip()
                
                items.append({
                    'modelo': model,
                    'categoria': category,
                    'descricao_item': description
                })
    
    # Gerar SQL
    sql_lines = []
    sql_lines.append('-- Migration: Popular memorial_okean com TODOS os ~1264 itens do CSV')
    sql_lines.append('-- Modelos: FY 550, FY 670, FY 720, FY 850')
    sql_lines.append('')
    sql_lines.append('-- Limpar dados existentes')
    sql_lines.append('TRUNCATE TABLE memorial_okean CASCADE;')
    sql_lines.append('')
    sql_lines.append('-- Resetar sequence')
    sql_lines.append('ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;')
    sql_lines.append('')
    sql_lines.append('-- Inserir todos os itens')
    sql_lines.append('INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES')
    
    # Gerar VALUES statements
    value_statements = []
    for item in items:
        modelo = escape_sql(item['modelo'])
        categoria = escape_sql(item['categoria'])
        descricao = escape_sql(item['descricao_item'])
        
        value = f"  ('{modelo}', '{categoria}', '{descricao}', 'Padrão', 1, true, null)"
        value_statements.append(value)
    
    sql_lines.append(',\n'.join(value_statements))
    sql_lines.append(';')
    sql_lines.append('')
    sql_lines.append(f'-- Total de {len(items)} itens inseridos')
    
    # Escrever arquivo
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    # Estatísticas
    models = {}
    for item in items:
        modelo = item['modelo']
        models[modelo] = models.get(modelo, 0) + 1
    
    print(f'✅ Migration SQL criada: {output_file}')
    print(f'📊 Total de itens: {len(items)}')
    print(f'📋 Distribuição por modelo:')
    for model, count in sorted(models.items()):
        print(f'   - {model}: {count} itens')

if __name__ == '__main__':
    main()
