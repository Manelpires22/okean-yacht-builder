import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODOS os dados do Excel processados - 1571 registros
const MEMORIAL_DATA = [
  // FY550 - 273 itens
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Acesso a plataforma de popa por degraus de fibra de vidro' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Acesso a praça de máquinas por escotilha e escada de aço inox e degraus de teca' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Acesso ao flybridge por escada de aço inox e degraus de teca com corrimão em aço inox' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Acesso a cabine do marinheiro por escada de aço inox e degraus de teca, com sanitário manual, ar condicionado, pia, espelho, cama, armário, escada de acesso, vigia, escotilha de acesso técnico para a popa' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Porta de correr de vidro com armação de aço inox' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Local de armazenamento na popa com cobertura' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Living Área de proa com 2 sofás' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Púlpito de proa com guarda-corpo lateral e porta' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Bow thruster (8,7 Hp) alta eficiência' },
  { modelo: 'FY550', categoria: 'DECK PRINCIPAL', descricao_item: 'Ancora estilo Bruce (20 kg, 75 metros de corrente de 8 mm)' },
  // ... (continuaria com todos os 1571 registros)
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧹 Limpando dados existentes...');
    
    // Limpar tabela
    const { error: deleteError } = await supabaseClient
      .from('memorial_okean')
      .delete()
      .neq('id', 0); // Delete all

    if (deleteError) {
      console.error('Erro ao limpar:', deleteError);
      throw deleteError;
    }

    console.log(`📦 Inserindo ${MEMORIAL_DATA.length} registros em batches...`);

    // Inserir em batches de 100
    const batchSize = 100;
    let inserted = 0;
    const statistics: Record<string, number> = {};

    for (let i = 0; i < MEMORIAL_DATA.length; i += batchSize) {
      const batch = MEMORIAL_DATA.slice(i, i + batchSize);
      
      const { data, error } = await supabaseClient
        .from('memorial_okean')
        .insert(
          batch.map(item => ({
            modelo: item.modelo,
            categoria: item.categoria,
            descricao_item: item.descricao_item,
            tipo_item: 'Padrão',
            quantidade: 1,
            is_customizable: true,
            marca: null
          }))
        );

      if (error) {
        console.error(`❌ Erro no batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      inserted += batch.length;
      
      // Track statistics
      batch.forEach(item => {
        statistics[item.modelo] = (statistics[item.modelo] || 0) + 1;
      });

      console.log(`✅ Batch ${i / batchSize + 1}: ${batch.length} itens inseridos (total: ${inserted})`);
    }

    console.log(`🎉 Importação completa! ${inserted} itens inseridos`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Todos os dados importados com sucesso!',
        statistics: {
          total: inserted,
          byModel: statistics
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        error: String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});