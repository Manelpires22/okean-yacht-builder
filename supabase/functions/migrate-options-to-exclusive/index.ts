import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Iniciando migração de opcionais para modelo exclusivo...');

    // 1. Buscar opcionais genéricos (sem yacht_model_id)
    const { data: genericOptions, error: genericError } = await supabase
      .from('options')
      .select('*')
      .is('yacht_model_id', null)
      .eq('is_active', true);

    if (genericError) {
      console.error('❌ Erro ao buscar opcionais genéricos:', genericError);
      throw genericError;
    }

    console.log(`📊 Opcionais genéricos encontrados: ${genericOptions?.length || 0}`);

    if (!genericOptions || genericOptions.length === 0) {
      console.log('✅ Nenhum opcional genérico para migrar');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum opcional genérico para migrar',
          stats: { genericOptions: 0, created: 0, deactivated: 0 },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 2. Buscar todos os modelos de barco ativos
    const { data: yachtModels, error: modelsError } = await supabase
      .from('yacht_models')
      .select('id, code')
      .eq('is_active', true);

    if (modelsError) {
      console.error('❌ Erro ao buscar modelos:', modelsError);
      throw modelsError;
    }

    console.log(`🚤 Modelos de barco ativos: ${yachtModels?.length || 0}`);

    if (!yachtModels || yachtModels.length === 0) {
      throw new Error('Nenhum modelo de barco ativo encontrado');
    }

    let createdCount = 0;
    const errors: string[] = [];

    // 3. Para cada opcional genérico, criar uma cópia para cada modelo
    for (const option of genericOptions) {
      for (const model of yachtModels) {
        try {
          const newOption = {
            code: `${option.code}-${model.code}`,
            name: option.name,
            description: option.description,
            category_id: option.category_id,
            yacht_model_id: model.id,
            base_price: option.base_price,
            delivery_days_impact: option.delivery_days_impact,
            is_active: option.is_active,
            technical_specifications: option.technical_specifications,
            cost: option.cost,
            image_url: option.image_url,
            is_configurable: option.is_configurable,
            configurable_sub_items: option.configurable_sub_items,
            job_stop_id: option.job_stop_id,
          };

          const { error: insertError } = await supabase
            .from('options')
            .insert(newOption);

          if (insertError) {
            // Se o código já existe, tentar com sufixo numérico
            if (insertError.code === '23505') {
              const fallbackCode = `${option.code}-${model.code}-${Date.now()}`;
              const { error: retryError } = await supabase
                .from('options')
                .insert({ ...newOption, code: fallbackCode });
              
              if (retryError) {
                console.error(`❌ Erro ao criar opcional ${option.name} para ${model.code}:`, retryError);
                errors.push(`${option.name} → ${model.code}: ${retryError.message}`);
              } else {
                console.log(`✅ Criado: ${fallbackCode}`);
                createdCount++;
              }
            } else {
              console.error(`❌ Erro ao criar opcional ${option.name} para ${model.code}:`, insertError);
              errors.push(`${option.name} → ${model.code}: ${insertError.message}`);
            }
          } else {
            console.log(`✅ Criado: ${newOption.code}`);
            createdCount++;
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`❌ Erro ao processar ${option.name} para ${model.code}:`, errorMessage);
          errors.push(`${option.name} → ${model.code}: ${errorMessage}`);
        }
      }
    }

    // 4. Desativar opcionais genéricos originais
    console.log('\n🔄 Desativando opcionais genéricos originais...');
    const genericIds = genericOptions.map(o => o.id);
    
    const { error: deactivateError } = await supabase
      .from('options')
      .update({ is_active: false })
      .in('id', genericIds);

    if (deactivateError) {
      console.error('❌ Erro ao desativar genéricos:', deactivateError);
      errors.push(`Desativação: ${deactivateError.message}`);
    } else {
      console.log(`✅ ${genericIds.length} opcionais genéricos desativados`);
    }

    console.log(`\n📊 Resumo da migração:`);
    console.log(`  📦 Opcionais genéricos processados: ${genericOptions.length}`);
    console.log(`  🚤 Modelos de barco: ${yachtModels.length}`);
    console.log(`  ✅ Opcionais específicos criados: ${createdCount}`);
    console.log(`  🔄 Opcionais genéricos desativados: ${genericIds.length}`);
    console.log(`  ❌ Erros: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n❌ Detalhes dos erros:`);
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log('\n✨ Migração concluída!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migração concluída com sucesso',
        stats: {
          genericOptions: genericOptions.length,
          yachtModels: yachtModels.length,
          created: createdCount,
          deactivated: genericIds.length,
          errors: errors.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
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
