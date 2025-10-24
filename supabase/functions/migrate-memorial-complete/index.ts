import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationReport {
  success: boolean;
  total_processed: number;
  total_inserted: number;
  total_skipped: number;
  total_errors: number;
  models_migrated: string[];
  errors: Array<{ modelo: string; error: string }>;
  details: Array<{
    model: string;
    items_count: number;
    categories_count: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Iniciando migração de memorial_okean → memorial_items...');

    // 1. Fetch all items from memorial_okean
    const { data: okeanItems, error: fetchError } = await supabase
      .from('memorial_okean')
      .select('*')
      .order('modelo')
      .order('category_display_order')
      .order('id');

    if (fetchError) throw fetchError;
    console.log(`📊 Total de itens em memorial_okean: ${okeanItems.length}`);

    // 2. Group items by (modelo, categoria) to preserve category_display_order
    const categoryOrders = new Map<string, number>();
    okeanItems.forEach((item) => {
      const key = `${item.modelo}|||${item.categoria}`;
      if (!categoryOrders.has(key)) {
        categoryOrders.set(key, item.category_display_order || 999);
      }
    });

    console.log(`🗂️  Total de (modelo, categoria) únicos: ${categoryOrders.size}`);

    // 3. Map to memorial_items format
    const itemsToInsert: any[] = [];
    const errors: Array<{ modelo: string; error: string }> = [];
    const modelSet = new Set<string>();

    for (const item of okeanItems) {
      try {
        // Map modelo → yacht_model_id
        const { data: modelId, error: modelError } = await supabase.rpc(
          'get_yacht_model_id',
          { modelo_text: item.modelo }
        );

        if (modelError) throw new Error(`Modelo não encontrado: ${item.modelo}`);
        modelSet.add(item.modelo);

        // Normalize categoria
        const { data: normalizedCategory, error: catError } = await supabase.rpc(
          'normalize_memorial_category',
          { okean_categoria: item.categoria }
        );

        if (catError) throw new Error(`Erro ao normalizar categoria: ${item.categoria}`);

        // Get category order
        const key = `${item.modelo}|||${item.categoria}`;
        const categoryOrder = categoryOrders.get(key) || 999;

        itemsToInsert.push({
          yacht_model_id: modelId,
          category: normalizedCategory,
          category_display_order: categoryOrder,
          item_name: item.descricao_item,
          brand: item.marca || null,
          model: item.tipo_item || null,
          quantity: item.quantidade || 1,
          unit: 'unidade',
          is_customizable: item.is_customizable ?? true,
          is_active: true,
          display_order: 0,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          modelo: item.modelo,
          error: errorMessage,
        });
        console.error(`❌ Erro ao processar item (modelo=${item.modelo}):`, errorMessage);
      }
    }

    console.log(`✅ Itens preparados para inserção: ${itemsToInsert.length}`);
    console.log(`⚠️  Erros durante processamento: ${errors.length}`);

    // 4. Bulk insert com ON CONFLICT DO NOTHING
    let insertedCount = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < itemsToInsert.length; i += BATCH_SIZE) {
      const batch = itemsToInsert.slice(i, i + BATCH_SIZE);
      
      const { data: inserted, error: insertError } = await supabase
        .from('memorial_items')
        .insert(batch)
        .select('id');

      if (insertError) {
        console.error(`❌ Erro no batch ${i / BATCH_SIZE + 1}:`, insertError.message);
        errors.push({
          modelo: 'batch_insert',
          error: insertError.message,
        });
      } else {
        insertedCount += inserted?.length || 0;
        console.log(`✅ Batch ${i / BATCH_SIZE + 1}: ${inserted?.length || 0} itens inseridos`);
      }
    }

    // 5. Get details per model
    const details: Array<{ model: string; items_count: number; categories_count: number }> = [];
    
    for (const modelo of Array.from(modelSet)) {
      const { data: modelId } = await supabase.rpc('get_yacht_model_id', { modelo_text: modelo });
      
      const { count: itemsCount } = await supabase
        .from('memorial_items')
        .select('*', { count: 'exact', head: true })
        .eq('yacht_model_id', modelId);

      const { data: categories } = await supabase
        .from('memorial_items')
        .select('category')
        .eq('yacht_model_id', modelId);

      const uniqueCategories = new Set(categories?.map((c) => c.category) || []);

      details.push({
        model: modelo,
        items_count: itemsCount || 0,
        categories_count: uniqueCategories.size,
      });
    }

    // 6. Generate report
    const report: MigrationReport = {
      success: errors.length === 0,
      total_processed: okeanItems.length,
      total_inserted: insertedCount,
      total_skipped: okeanItems.length - insertedCount,
      total_errors: errors.length,
      models_migrated: Array.from(modelSet),
      errors,
      details,
    };

    console.log('📋 Relatório final:', JSON.stringify(report, null, 2));

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro crítico na migração:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
