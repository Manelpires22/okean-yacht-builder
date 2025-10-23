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

    // 1. Buscar todos os vínculos option_yacht_models
    const { data: links, error: linksError } = await supabase
      .from('option_yacht_models')
      .select('*');

    if (linksError) {
      console.error('❌ Erro ao buscar vínculos:', linksError);
      throw linksError;
    }

    console.log(`📊 Total de vínculos encontrados: ${links?.length || 0}`);

    // 2. Agrupar por option_id
    const groupedByOption: Record<string, string[]> = {};
    for (const link of links || []) {
      if (!groupedByOption[link.option_id]) {
        groupedByOption[link.option_id] = [];
      }
      groupedByOption[link.option_id].push(link.yacht_model_id);
    }

    console.log(`📦 Total de opcionais únicos: ${Object.keys(groupedByOption).length}`);

    let updatedCount = 0;
    let createdCount = 0;
    const errors: string[] = [];

    // 3. Para cada opcional
    for (const [optionId, yachtModelIds] of Object.entries(groupedByOption)) {
      try {
        // Buscar dados do opcional
        const { data: option, error: optionError } = await supabase
          .from('options')
          .select('*')
          .eq('id', optionId)
          .single();

        if (optionError || !option) {
          console.warn(`⚠️ Opcional ${optionId} não encontrado, pulando...`);
          errors.push(`Opcional ${optionId} não encontrado`);
          continue;
        }

        if (yachtModelIds.length === 1) {
          // Apenas 1 modelo: atualizar diretamente
          const { error: updateError } = await supabase
            .from('options')
            .update({ yacht_model_id: yachtModelIds[0] })
            .eq('id', optionId);

          if (updateError) {
            console.error(`❌ Erro ao atualizar opcional ${optionId}:`, updateError);
            errors.push(`Erro ao atualizar ${option.name}: ${updateError.message}`);
          } else {
            console.log(`✅ Opcional "${option.name}" vinculado ao modelo ${yachtModelIds[0]}`);
            updatedCount++;
          }
        } else {
          // Múltiplos modelos: criar cópias
          console.log(`🔄 Opcional "${option.name}" vinculado a ${yachtModelIds.length} modelos, criando cópias...`);

          for (let i = 0; i < yachtModelIds.length; i++) {
            if (i === 0) {
              // Primeira iteração: atualizar original
              const { error: updateError } = await supabase
                .from('options')
                .update({ yacht_model_id: yachtModelIds[i] })
                .eq('id', optionId);

              if (updateError) {
                console.error(`❌ Erro ao atualizar opcional original ${optionId}:`, updateError);
                errors.push(`Erro ao atualizar original de ${option.name}: ${updateError.message}`);
              } else {
                console.log(`  ✅ Original vinculado ao modelo ${yachtModelIds[i]}`);
                updatedCount++;
              }
            } else {
              // Demais: inserir cópias
              const newOption = {
                ...option,
                yacht_model_id: yachtModelIds[i],
              };
              delete newOption.id; // Remove ID para criar novo registro
              delete newOption.created_at;
              delete newOption.updated_at;

              const { error: insertError } = await supabase
                .from('options')
                .insert(newOption);

              if (insertError) {
                console.error(`❌ Erro ao criar cópia do opcional ${optionId}:`, insertError);
                errors.push(`Erro ao criar cópia de ${option.name}: ${insertError.message}`);
              } else {
                console.log(`  ✅ Cópia criada para modelo ${yachtModelIds[i]}`);
                createdCount++;
              }
            }
          }
        }
      } catch (err) {
        console.error(`❌ Erro ao processar opcional ${optionId}:`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push(`Erro ao processar opcional ${optionId}: ${errorMessage}`);
      }
    }

    console.log(`\n📊 Resumo da migração:`);
    console.log(`  ✅ Opcionais atualizados: ${updatedCount}`);
    console.log(`  ✅ Cópias criadas: ${createdCount}`);
    console.log(`  ❌ Erros: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n❌ Detalhes dos erros:`);
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // 4. Limpar tabela option_yacht_models
    console.log(`\n🗑️ Limpando tabela option_yacht_models...`);
    const { error: deleteError } = await supabase
      .from('option_yacht_models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo

    if (deleteError) {
      console.error('❌ Erro ao limpar option_yacht_models:', deleteError);
      errors.push(`Erro ao limpar option_yacht_models: ${deleteError.message}`);
    } else {
      console.log('✅ Tabela option_yacht_models limpa com sucesso!');
    }

    console.log('\n✨ Migração concluída!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migração concluída com sucesso',
        stats: {
          updated: updatedCount,
          created: createdCount,
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
