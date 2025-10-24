#!/usr/bin/env python3
"""
Gera migration SQL completa a partir do boat_items.csv
Processa todas as 1267 linhas e normaliza dados
"""

import csv
import re
from pathlib import Path

def normalize_model(model: str) -> str:
    """Normaliza FY550 → FY 550"""
    match = re.match(r'^(FY)(\d+)$', model.strip())
    return f'{match.group(1)} {match.group(2)}' if match else model.strip()

def escape_sql(text: str) -> str:
    """Escapa aspas simples para SQL"""
    return text.replace("'", "''")

def main():
    # Paths
    csv_path = Path(__file__).parent.parent / 'supabase' / 'functions' / 'import-memorial-okean' / 'boat_items.csv'
    output_path = Path(__file__).parent.parent / 'supabase' / 'migrations' / '20251024060000_memorial_okean_complete_data.sql'
    
    print(f'📖 Lendo {csv_path}...')
    
    items = []
    
    # Ler CSV pulando as 3 primeiras linhas de header
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()[3:]  # Pular header
        
        # Parse manual para lidar com aspas complexas
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Parse CSV com aspas
            parts = []
            current = ''
            in_quotes = False
            
            for char in line:
                if char == '"':
                    in_quotes = not in_quotes
                elif char == ',' and not in_quotes:
                    parts.append(current)
                    current = ''
                else:
                    current += char
            
            parts.append(current)
            
            if len(parts) >= 3 and parts[0].strip():
                model = parts[0].strip()
                category = parts[1].strip()
                description = parts[2].strip().strip('"')
                
                items.append({
                    'modelo': normalize_model(model),
                    'categoria': category,
                    'descricao': description
                })
    
    print(f'✅ {len(items)} itens parseados')
    
    # Estatísticas
    by_model = {}
    for item in items:
        modelo = item['modelo']
        by_model[modelo] = by_model.get(modelo, 0) + 1
    
    print('\n📊 Distribuição por modelo:')
    for model in sorted(by_model.keys()):
        print(f'   - {model}: {by_model[model]} itens')
    
    # Gerar SQL
    print('\n💾 Gerando migration SQL...')
    
    sql_lines = []
    sql_lines.append(f'-- Migration: Popular memorial_okean com TODOS os {len(items)} itens')
    sql_lines.append(f'-- Distribuição: {", ".join(f"{m}: {c}" for m, c in sorted(by_model.items()))}')
    sql_lines.append('')
    sql_lines.append('-- Limpar dados existentes')
    sql_lines.append('TRUNCATE TABLE memorial_okean CASCADE;')
    sql_lines.append('')
    sql_lines.append('-- Resetar sequence')
    sql_lines.append('ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;')
    sql_lines.append('')
    sql_lines.append('-- Inserir todos os itens')
    sql_lines.append('INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES')
    
    # VALUES statements
    values = []
    for item in items:
        modelo = escape_sql(item['modelo'])
        categoria = escape_sql(item['categoria'])
        descricao = escape_sql(item['descricao'])
        values.append(f"  ('{modelo}', '{categoria}', '{descricao}', 'Padrão', 1, true, null)")
    
    sql_lines.append(',\n'.join(values))
    sql_lines.append(';')
    sql_lines.append('')
    sql_lines.append(f'-- ✅ Total de {len(items)} itens inseridos!')
    
    # Escrever arquivo
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f'\n✅ Migration gerada: {output_path}')
    print(f'📝 Total de {len(items)} INSERT statements')
    print('\n🚀 Próximo passo: Executar migration no Supabase!')

if __name__ == '__main__':
    main()
