import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🚀 Starting memorial items migration...');

    // 1. Buscar todos os yacht_models com technical_specifications
    const { data: models, error: modelsError } = await supabase
      .from('yacht_models')
      .select('id, name, code, technical_specifications')
      .not('technical_specifications', 'is', null);

    if (modelsError) throw modelsError;

    console.log(`📋 Found ${models?.length || 0} models with specifications`);

    let totalItemsMigrated = 0;

    // 2. Para cada modelo, extrair items do JSON
    for (const model of models || []) {
      const specs = model.technical_specifications;
      
      if (!specs || typeof specs !== 'object') continue;

      console.log(`🔧 Processing model: ${model.code} - ${model.name}`);

      const itemsToInsert = [];

      // 3. Iterar sobre cada categoria no JSON
      for (const [categoryKey, categoryData] of Object.entries(specs)) {
        // Mapear key do JSON para enum
        const categoryMap: Record<string, string> = {
          'dimensoes': 'dimensoes',
          'dimensões': 'dimensoes',
          'motorizacao': 'motorizacao',
          'motorização': 'motorizacao',
          'sistema_eletrico': 'sistema_eletrico',
          'sistema_elétrico': 'sistema_eletrico',
          'eletrica': 'sistema_eletrico',
          'elétrica': 'sistema_eletrico',
          'sistema_hidraulico': 'sistema_hidraulico',
          'sistema_hidráulico': 'sistema_hidraulico',
          'hidraulica': 'sistema_hidraulico',
          'hidráulica': 'sistema_hidraulico',
          'acabamentos': 'acabamentos',
          'equipamentos': 'equipamentos',
          'seguranca': 'seguranca',
          'segurança': 'seguranca',
          'conforto': 'conforto',
        };

        const category = categoryMap[categoryKey.toLowerCase()] || 'outros';

        // 4. Se categoryData for objeto, iterar subitems
        if (typeof categoryData === 'object' && categoryData !== null) {
          let order = 0;
          for (const [itemKey, itemValue] of Object.entries(categoryData)) {
            // Extrair marca/modelo se possível (heurística simples)
            const valueStr = String(itemValue);
            const brandMatch = valueStr.match(/^([A-Z][a-zA-Z0-9\s]+)\s+([A-Z0-9]+)/);
            
            itemsToInsert.push({
              yacht_model_id: model.id,
              category,
              display_order: order++,
              item_name: itemKey.replace(/_/g, ' '),
              description: valueStr.length > 200 ? valueStr.substring(0, 197) + '...' : valueStr,
              brand: brandMatch ? brandMatch[1].trim() : null,
              model: brandMatch ? brandMatch[2].trim() : null,
              quantity: 1,
              unit: 'unidade',
              is_customizable: true,
              is_active: true,
            });
          }
        } else {
          // Se categoryData for string/number direto
          itemsToInsert.push({
            yacht_model_id: model.id,
            category,
            display_order: 0,
            item_name: categoryKey.replace(/_/g, ' '),
            description: String(categoryData),
            quantity: 1,
            unit: 'unidade',
            is_customizable: true,
            is_active: true,
          });
        }
      }

      // 5. Inserir items no banco
      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('memorial_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error(`❌ Error inserting items for model ${model.code}:`, insertError);
        } else {
          console.log(`✅ Migrated ${itemsToInsert.length} items for model ${model.code}`);
          totalItemsMigrated += itemsToInsert.length;
        }
      }
    }

    console.log(`🎉 Migration complete! Total items migrated: ${totalItemsMigrated}`);

    return new Response(
      JSON.stringify({
        success: true,
        modelsProcessed: models?.length || 0,
        totalItemsMigrated,
        message: 'Migration completed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
