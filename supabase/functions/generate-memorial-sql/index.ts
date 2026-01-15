import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeSql(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return value.toString();
  if (Array.isArray(value)) {
    if (value.length === 0) return "N'[]'";
    return `N'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  if (typeof value === 'object') {
    if (Object.keys(value).length === 0) return 'NULL';
    return `N'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `N'${String(value).replace(/'/g, "''")}'`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'NULL';
  return `'${dateStr}'`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching memorial_items...')

    // Fetch all records in batches
    const allRecords: any[] = []
    let offset = 0
    const batchSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('memorial_items')
        .select('*')
        .order('yacht_model_id', { ascending: true })
        .order('category_display_order', { ascending: true })
        .order('display_order', { ascending: true })
        .range(offset, offset + batchSize - 1)

      if (error) {
        console.error('Error fetching:', error)
        break
      }

      if (!data || data.length === 0) break

      allRecords.push(...data)
      console.log(`Loaded ${allRecords.length} records...`)

      if (data.length < batchSize) break
      offset += batchSize
    }

    console.log(`Total records: ${allRecords.length}`)

    // Generate SQL
    let sql = `-- ============================================
-- OKEAN CPQ - SQL Server Migration
-- Tabela: memorial_items
-- Registros: ${allRecords.length}
-- Gerado em: ${new Date().toISOString()}
-- ============================================
SET NOCOUNT ON;
GO

-- Limpar dados existentes (opcional - descomente se necessário)
-- DELETE FROM [dbo].[memorial_items];
-- GO

`

    // Insert in batches of 500
    const insertBatchSize = 500
    for (let i = 0; i < allRecords.length; i += insertBatchSize) {
      const batch = allRecords.slice(i, i + insertBatchSize)

      sql += `-- Batch ${Math.floor(i / insertBatchSize) + 1} de ${Math.ceil(allRecords.length / insertBatchSize)}\n`
      sql += `INSERT INTO [dbo].[memorial_items] ([id], [yacht_model_id], [category_id], [category], [item_name], [code], [description], [brand], [model], [quantity], [unit], [display_order], [category_display_order], [is_active], [is_customizable], [is_configurable], [has_upgrades], [image_url], [images], [technical_specs], [configurable_sub_items], [job_stop_id], [created_by], [created_at], [updated_at])\nVALUES\n`

      const values = batch.map(record => {
        return `  (${escapeSql(record.id)}, ${escapeSql(record.yacht_model_id)}, ${escapeSql(record.category_id)}, ${escapeSql(record.category)}, ${escapeSql(record.item_name)}, ${escapeSql(record.code)}, ${escapeSql(record.description)}, ${escapeSql(record.brand)}, ${escapeSql(record.model)}, ${record.quantity || 'NULL'}, ${escapeSql(record.unit)}, ${record.display_order || 0}, ${record.category_display_order || 'NULL'}, ${record.is_active ? 1 : 0}, ${record.is_customizable ? 1 : 0}, ${record.is_configurable ? 1 : 0}, ${record.has_upgrades ? 1 : 0}, ${escapeSql(record.image_url)}, ${escapeSql(record.images)}, ${escapeSql(record.technical_specs)}, ${escapeSql(record.configurable_sub_items)}, ${escapeSql(record.job_stop_id)}, ${escapeSql(record.created_by)}, ${formatDate(record.created_at)}, ${formatDate(record.updated_at)})`
      })

      sql += values.join(',\n')
      sql += ';\nGO\n\n'
    }

    sql += `-- ============================================
-- Verificação
-- ============================================
SELECT COUNT(*) AS [Total memorial_items] FROM [dbo].[memorial_items];
GO

PRINT 'memorial_items: ${allRecords.length} registros inseridos com sucesso!';
GO
`

    return new Response(sql, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sqlserver-migration-memorial-items.sql"'
      }
    })

  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
