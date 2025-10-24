#!/usr/bin/env python3
"""
Processa combined_boat_items.xlsx e gera migration SQL completa
com todos os ~1571 registros do Memorial OKEAN
"""

import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("❌ openpyxl não instalado. Instale com: pip install openpyxl")
    sys.exit(1)

def escape_sql(text: str) -> str:
    """Escapa aspas simples para SQL"""
    if not text:
        return ''
    return str(text).replace("'", "''")

def main():
    # Paths
    excel_path = Path(__file__).parent.parent / 'data' / 'combined_boat_items.xlsx'
    output_path = Path(__file__).parent.parent / 'supabase' / 'migrations' / '20251024070000_populate_memorial_complete.sql'
    
    if not excel_path.exists():
        print(f'❌ Arquivo não encontrado: {excel_path}')
        sys.exit(1)
    
    print(f'📖 Lendo {excel_path}...')
    
    # Ler Excel
    wb = openpyxl.load_workbook(excel_path)
    sheet = wb.active
    
    items = []
    models_count = {}
    
    # Processar linhas (pular header)
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if not row[0]:  # Pular linhas vazias
            continue
        
        modelo = str(row[0]).strip()
        categoria = str(row[1]).strip() if row[1] else ''
        descricao = str(row[2]).strip() if row[2] else ''
        
        if not modelo or not categoria or not descricao:
            continue
        
        items.append({
            'modelo': modelo,
            'categoria': categoria,
            'descricao': descricao
        })
        
        models_count[modelo] = models_count.get(modelo, 0) + 1
    
    print(f'✅ {len(items)} itens processados')
    
    # Estatísticas
    print('\n📊 Distribuição por modelo:')
    for model in sorted(models_count.keys()):
        print(f'   - {model}: {models_count[model]} itens')
    
    # Gerar SQL
    print('\n💾 Gerando migration SQL...')
    
    sql_lines = []
    sql_lines.append(f'-- Migration: Popular memorial_okean com TODOS os {len(items)} itens')
    sql_lines.append(f'-- Data: 2025-10-24')
    sql_lines.append(f'-- Fonte: combined_boat_items.xlsx')
    sql_lines.append('')
    sql_lines.append('-- Limpar dados existentes')
    sql_lines.append('TRUNCATE TABLE memorial_okean CASCADE;')
    sql_lines.append('')
    sql_lines.append('-- Resetar sequence')
    sql_lines.append('ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;')
    sql_lines.append('')
    sql_lines.append('-- Inserir todos os itens')
    sql_lines.append('INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES')
    
    # VALUES statements (batch de 100 por segurança)
    values = []
    for i, item in enumerate(items, 1):
        modelo = escape_sql(item['modelo'])
        categoria = escape_sql(item['categoria'])
        descricao = escape_sql(item['descricao'])
        
        values.append(f"  ('{modelo}', '{categoria}', '{descricao}', 'Padrão', 1, true, null)")
        
        # A cada 500 itens ou no final, inserir batch
        if i % 500 == 0 or i == len(items):
            if i == len(items):
                # Último batch - fecha com ;
                sql_lines.append(',\n'.join(values))
                sql_lines.append(';')
            else:
                # Batch intermediário - fecha e abre novo INSERT
                sql_lines.append(',\n'.join(values))
                sql_lines.append(';')
                sql_lines.append('')
                sql_lines.append('INSERT INTO memorial_okean (modelo, categoria, descricao_item, tipo_item, quantidade, is_customizable, marca) VALUES')
                values = []
    
    sql_lines.append('')
    sql_lines.append(f'-- ✅ Total de {len(items)} itens inseridos!')
    sql_lines.append(f'-- Modelos: {", ".join(sorted(models_count.keys()))}')
    
    # Escrever arquivo
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f'\n✅ Migration gerada: {output_path}')
    print(f'📝 Total de {len(items)} registros')
    print(f'\n🚀 Próximo passo: Executar migration no Lovable!')

if __name__ == '__main__':
    main()
