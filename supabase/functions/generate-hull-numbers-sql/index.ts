import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to escape SQL strings for SQL Server
function escapeSql(value: string | null | undefined): string {
  if (value === null || value === undefined) return 'NULL';
  // Replace single quotes with two single quotes and use N'' for Unicode
  return `N'${String(value).replace(/'/g, "''")}'`;
}

// Helper to format dates for SQL Server
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'NULL';
  // Extract just the date part (YYYY-MM-DD)
  const date = dateStr.split('T')[0];
  return `'${date}'`;
}

// Helper to format datetime for SQL Server  
function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'NULL';
  // Convert ISO format to SQL Server format
  return `'${dateStr.replace('T', ' ').replace('+00', '').substring(0, 23)}'`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching all hull_numbers...');

    // Fetch all hull numbers ordered by model and hull number
    const { data: hullNumbers, error } = await supabase
      .from('hull_numbers')
      .select('*')
      .order('yacht_model_id')
      .order('hull_number');

    if (error) {
      throw new Error(`Error fetching hull_numbers: ${error.message}`);
    }

    console.log(`Found ${hullNumbers?.length || 0} hull numbers`);

    // Generate SQL header
    let sql = `-- ================================================================
-- OKEAN CPQ - SQL Server Migration Script
-- Table: hull_numbers
-- Generated: ${new Date().toISOString()}
-- Total Records: ${hullNumbers?.length || 0}
-- ================================================================

-- This script contains all hull_numbers data for SQL Server migration
-- Execute this after creating the hull_numbers table schema

SET NOCOUNT ON;
GO

-- Clear existing data (optional - uncomment if needed)
-- TRUNCATE TABLE [dbo].[hull_numbers];
-- GO

PRINT 'Inserting ${hullNumbers?.length || 0} hull_numbers records...';
GO

`;

    // Generate INSERT statements in batches of 50
    const batchSize = 50;
    let currentBatch: string[] = [];
    let batchCount = 0;

    for (let i = 0; i < (hullNumbers?.length || 0); i++) {
      const h = hullNumbers![i];
      
      const values = `(
    ${escapeSql(h.id)},
    ${escapeSql(h.hull_number)},
    ${escapeSql(h.brand)},
    ${escapeSql(h.yacht_model_id)},
    ${escapeSql(h.status)},
    ${formatDate(h.hull_entry_date)},
    ${formatDate(h.estimated_delivery_date)},
    ${formatDate(h.job_stop_1_date)},
    ${formatDate(h.job_stop_2_date)},
    ${formatDate(h.job_stop_3_date)},
    ${formatDate(h.job_stop_4_date)},
    ${formatDate(h.barco_aberto_date)},
    ${formatDate(h.barco_fechado_date)},
    ${formatDate(h.fechamento_convesdeck_date)},
    ${formatDate(h.teste_piscina_date)},
    ${formatDate(h.teste_mar_date)},
    ${formatDate(h.entrega_comercial_date)},
    ${h.contract_id ? escapeSql(h.contract_id) : 'NULL'},
    ${formatDateTime(h.created_at)},
    ${formatDateTime(h.updated_at)}
  )`;

      currentBatch.push(values);

      // Write batch when full or at end
      if (currentBatch.length >= batchSize || i === (hullNumbers?.length || 0) - 1) {
        batchCount++;
        sql += `-- Batch ${batchCount} (records ${i - currentBatch.length + 2} to ${i + 1})
INSERT INTO [dbo].[hull_numbers] (
  [id],
  [hull_number],
  [brand],
  [yacht_model_id],
  [status],
  [hull_entry_date],
  [estimated_delivery_date],
  [job_stop_1_date],
  [job_stop_2_date],
  [job_stop_3_date],
  [job_stop_4_date],
  [barco_aberto_date],
  [barco_fechado_date],
  [fechamento_convesdeck_date],
  [teste_piscina_date],
  [teste_mar_date],
  [entrega_comercial_date],
  [contract_id],
  [created_at],
  [updated_at]
)
VALUES
${currentBatch.join(',\n')};
GO

`;
        currentBatch = [];
      }
    }

    // Add footer
    sql += `
-- ================================================================
-- Verification
-- ================================================================
PRINT 'Hull numbers migration complete!';
SELECT COUNT(*) AS TotalHullNumbers FROM [dbo].[hull_numbers];
GO
`;

    console.log(`Generated SQL with ${batchCount} batches`);

    return new Response(sql, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="sqlserver-migration-hull-numbers-complete.sql"',
      },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
