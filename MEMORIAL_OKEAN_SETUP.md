# Setup Memorial OKEAN - Guia Completo

## Problema Identificado

O CSV `boat_items.csv` (~1267 itens) não é deployado com edge functions do Supabase.
Apenas código TypeScript/JavaScript é deployado, arquivos estáticos como CSVs são ignorados.

## Soluções Disponíveis

### Opção 1: Script Python (Recomendado)

Execute o script Python para gerar a migration SQL completa:

```bash
# No diretório raiz do projeto
python3 scripts/generate_memorial_sql.py
```

Isso irá gerar automaticamente:
- `supabase/migrations/20251024060000_memorial_okean_complete_data.sql`
- SQL com TODOS os ~1267 registros
- Modelos normalizados (FY550 → FY 550)
- Escape correto de aspas simples

Depois execute a migration:
```bash
# Via Lovable UI: Clicar em "Run Migration"
# OU via Supabase CLI:
supabase db push
```

### Opção 2: Script Node.js

Se preferir Node.js:

```bash
node scripts/generate-memorial-migration.js
```

### Opção 3: Manual via SQL Editor do Supabase

1. Acesse: https://supabase.com/dashboard/project/qqxhkaowexieednyazwq/sql/new
2. Execute os seguintes SQLs em sequência:

#### Passo 1: Limpar dados existentes

```sql
TRUNCATE TABLE memorial_okean CASCADE;
ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;
```

#### Passo 2: Popular dados

Você precisará executar o script Python/Node.js para gerar os INSERT statements,
pois são ~1267 registros e seria impraticável fazer manualmente.

## Estatísticas Esperadas

Após importação completa, você deve ter:

- **FY 550**: ~270 itens
- **FY 670**: ~316 itens  
- **FY 720**: ~309 itens
- **FY 850**: ~369 itens
- **TOTAL**: ~1264 itens

## Verificação

Após executar a migration, verifique no frontend:

1. Acesse `/admin/memorial-okean`
2. Filtro "Modelo" deve mostrar: Todos, FY 550, FY 670, FY 720, FY 850
3. Total de itens deve ser ~1264
4. Cada modelo deve ter suas categorias específicas

## Troubleshooting

### "Ainda tenho apenas 34 itens"

Execute o script Python/Node.js para gerar a migration completa, depois rode-a.

### "Script Python não funciona"

Certifique-se de ter Python 3 instalado:
```bash
python3 --version
```

### "Edge function continua falhando"

A edge function de import foi desativada. Use migration SQL diretamente.

### "Dados estão duplicados"

Execute:
```sql
TRUNCATE TABLE memorial_okean CASCADE;
ALTER SEQUENCE memorial_okean_id_seq RESTART WITH 1;
```

Depois rode a migration novamente.

## Estrutura dos Dados

Cada item tem:
```typescript
{
  id: number,              // Auto-incremento
  modelo: string,          // "FY 550", "FY 670", "FY 720", "FY 850"
  categoria: string,       // "DECK PRINCIPAL", "SALÃO", etc
  descricao_item: string,  // Descrição completa
  tipo_item: string,       // "Padrão"
  quantidade: number,      // 1 (padrão)
  is_customizable: boolean, // true (padrão)
  marca: string | null,    // null (padrão)
  created_at: timestamp    // Auto
}
```

## Próximos Passos

1. Executar script Python: `python3 scripts/generate_memorial_sql.py`
2. Verificar arquivo gerado em `supabase/migrations/`
3. Executar migration via Lovable ou Supabase CLI
4. Verificar no frontend que todos os itens foram importados
5. Filtrar por modelo e categoria para confirmar dados corretos

## Contato

Se continuar com problemas, compartilhe:
- Screenshot do erro
- Console logs (`console.log` no frontend)
- Resultado de `SELECT COUNT(*) FROM memorial_okean;`
