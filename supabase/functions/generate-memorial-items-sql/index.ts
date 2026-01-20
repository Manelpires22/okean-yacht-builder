import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeSql(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value) || typeof value === 'object') {
    // JSON fields - escape for SQL Server NVARCHAR
    const jsonStr = JSON.stringify(value);
    return `N'${jsonStr.replace(/'/g, "''")}'`;
  }
  // String - escape single quotes
  return `N'${String(value).replace(/'/g, "''")}'`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'NULL';
  // Format: YYYY-MM-DD HH:MM:SS
  const date = new Date(dateStr);
  const formatted = date.toISOString().replace('T', ' ').substring(0, 23);
  return `'${formatted}'`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all memorial items in batches
    const allItems: any[] = [];
    let offset = 0;
    const batchSize = 500;
    
    while (true) {
      const { data, error } = await supabase
        .from('memorial_items')
        .select('*')
        .order('yacht_model_id')
        .order('category_display_order')
        .order('display_order')
        .range(offset, offset + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allItems.push(...data);
      offset += batchSize;
      
      if (data.length < batchSize) break;
    }

    console.log(`Fetched ${allItems.length} memorial items`);

    // Generate SQL script
    let sql = `-- ============================================
-- OKEAN CPQ - SQL Server Migration
-- Table: memorial_items
-- Generated: ${new Date().toISOString()}
-- Total Records: ${allItems.length}
-- ============================================

-- IMPORTANT: JSON fields (images, configurable_sub_items, technical_specs) 
-- are stored as NVARCHAR(MAX). Use OPENJSON to parse them in SQL Server.

SET NOCOUNT ON;
GO

-- Clear existing data (optional - comment out if you want to preserve data)
-- TRUNCATE TABLE memorial_items;
-- GO

PRINT 'Inserting ${allItems.length} memorial_items records...';
GO

`;

    // Generate INSERT statements in batches of 100
    const insertBatchSize = 100;
    for (let i = 0; i < allItems.length; i += insertBatchSize) {
      const batch = allItems.slice(i, i + insertBatchSize);
      
      sql += `-- Batch ${Math.floor(i / insertBatchSize) + 1} of ${Math.ceil(allItems.length / insertBatchSize)}\n`;
      
      for (const item of batch) {
        sql += `INSERT INTO memorial_items (
  id, yacht_model_id, code, category, category_id, item_name, description,
  brand, model, quantity, unit, display_order, category_display_order,
  is_customizable, is_configurable, is_active, job_stop_id, image_url,
  images, technical_specs, configurable_sub_items, has_upgrades,
  created_at, updated_at, created_by
) VALUES (
  ${escapeSql(item.id)},
  ${escapeSql(item.yacht_model_id)},
  ${escapeSql(item.code)},
  ${escapeSql(item.category)},
  ${escapeSql(item.category_id)},
  ${escapeSql(item.item_name)},
  ${escapeSql(item.description)},
  ${escapeSql(item.brand)},
  ${escapeSql(item.model)},
  ${item.quantity ?? 'NULL'},
  ${escapeSql(item.unit)},
  ${item.display_order ?? 0},
  ${item.category_display_order ?? 'NULL'},
  ${item.is_customizable ? 1 : 0},
  ${item.is_configurable ? 1 : 0},
  ${item.is_active ? 1 : 0},
  ${escapeSql(item.job_stop_id)},
  ${escapeSql(item.image_url)},
  ${escapeSql(item.images || [])},
  ${escapeSql(item.technical_specs)},
  ${escapeSql(item.configurable_sub_items || [])},
  ${item.has_upgrades ? 1 : 0},
  ${formatDate(item.created_at)},
  ${formatDate(item.updated_at)},
  ${escapeSql(item.created_by)}
);
`;
      }
      
      sql += `GO\n\n`;
    }

    sql += `
PRINT 'Memorial items migration complete. ${allItems.length} records inserted.';
GO

-- Verify count
SELECT COUNT(*) AS TotalRecords FROM memorial_items;
GO
`;

    return new Response(sql, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sqlserver-migration-memorial-items-complete.sql"',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
