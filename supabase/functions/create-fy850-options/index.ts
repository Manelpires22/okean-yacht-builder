import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar o modelo FY850
    const { data: model, error: modelError } = await supabase
      .from('yacht_models')
      .select('id')
      .eq('code', 'FY850')
      .single()

    if (modelError || !model) {
      throw new Error('Modelo FY850 não encontrado')
    }

    const yachtModelId = model.id

    // Buscar categoria "Opcionais" ou criar
    let { data: category } = await supabase
      .from('option_categories')
      .select('id')
      .eq('name', 'Opcionais FY850')
      .single()

    if (!category) {
      const { data: newCategory, error: categoryError } = await supabase
        .from('option_categories')
        .insert({ name: 'Opcionais FY850', display_order: 100, is_active: true })
        .select()
        .single()
      
      if (categoryError) throw categoryError
      category = newCategory
    }

    if (!category) {
      throw new Error('Falha ao criar categoria')
    }

    const categoryId = category.id

    // Opcionais sugeridos do documento
    const options = [
      { code: 'FY850-OPT-01', name: 'Teto de vidro fixo (HT)', desc: 'HT: teto de vidro fixo' },
      { code: 'FY850-OPT-02', name: 'Stern thruster', desc: 'Stern thruster' },
      { code: 'FY850-OPT-03', name: 'Ar-condicionado tropical', desc: 'Ar-condicionado tropical (salão + cabines + 2 cabines de tripulação)' },
      { code: 'FY850-OPT-04', name: 'Upgrade gerador ONAN 29 kW', desc: 'Upgrade gerador: ONAN 29 kW (2)' },
      { code: 'FY850-OPT-05', name: 'Separador de fumaça gerador', desc: 'Separador de fumaça para gerador (29 kW) – cada' },
      { code: 'FY850-OPT-06', name: 'Terceira estação comando cockpit', desc: 'Terceira estação comando no cockpit' },
      { code: 'FY850-OPT-07', name: 'Filtro RACOR gerador', desc: 'Filtro RACOR para gerador – cada' },
      { code: 'FY850-OPT-08', name: 'Entrada de água doce', desc: 'Entrada de água doce' },
      { code: 'FY850-OPT-09', name: 'Revestimento teca flybridge', desc: 'Revestimento em teca no flybridge' },
      { code: 'FY850-OPT-10', name: 'Revestimento teca passadiços', desc: 'Revestimento em teca nos passadiços e na proa' },
      { code: 'FY850-OPT-11', name: 'Luzes subaquáticas', desc: 'Luzes subaquáticas (6)' },
      { code: 'FY850-OPT-12', name: 'Luzes cortesia escada flybridge', desc: 'Luzes de cortesia na escada para o flybridge' },
      { code: 'FY850-OPT-13', name: 'Luzes cortesia plataforma banho', desc: 'Luzes de cortesia no acesso a plataforma de banho' },
      { code: 'FY850-OPT-14', name: 'Luzes cortesia deck inferior', desc: 'Luzes de cortesia na escada de acesso ao deck inferior' },
      { code: 'FY850-OPT-15', name: 'Cunho retrátil plataforma', desc: 'Cunho retrátil na plataforma de popa (1 par)' },
      { code: 'FY850-OPT-16', name: 'Lixeira no cockpit', desc: 'Lixeira no cockpit' },
      { code: 'FY850-OPT-17', name: 'Geladeira side by side', desc: 'Geladeira "side by side"' },
      { code: 'FY850-OPT-18', name: 'Porta lateral bombordo popa', desc: 'Porta lateral a bombordo na praça de popa' },
      { code: 'FY850-OPT-19', name: 'Tendalino cobertura fly', desc: 'Tendalino de cobertura com hastes de carbono para o fly' },
      { code: 'FY850-OPT-20', name: 'Tendalino cobertura proa', desc: 'Tendalino de cobertura com hastes de carbono para da proa' },
      { code: 'FY850-OPT-21', name: 'Luzes embutidas proa', desc: 'Luzes embutidas na proa - 4' },
      { code: 'FY850-OPT-22', name: 'Estabilizadores zero speed', desc: 'Estabilizadores "zero speed"' },
      { code: 'FY850-OPT-23', name: 'TV 55" salão', desc: 'TV 55" no salão' },
      { code: 'FY850-OPT-24', name: 'TV 48" cabine principal', desc: 'TV 48" na cabine principal' },
      { code: 'FY850-OPT-25', name: 'TV 32" cabine VIP', desc: 'TV 32" na cabine VIP' },
      { code: 'FY850-OPT-26', name: 'TV 32" cabine bombordo', desc: 'TV 32" na cabine de hóspedes a bombordo' },
      { code: 'FY850-OPT-27', name: 'TV 22" cabine boreste', desc: 'TV 22" na cabine de hóspedes a boreste' },
      { code: 'FY850-OPT-28', name: 'Predisposição decoder', desc: 'Predisposição para instalação de decoder em todas as cabines e salão' },
      { code: 'FY850-OPT-29', name: 'Camera TV externa', desc: 'Camera de TV externa colorida' },
      { code: 'FY850-OPT-30', name: 'Camera TV interna', desc: 'Camera de TV interna colorida' },
      { code: 'FY850-OPT-31', name: 'Upgrade SIMRAD', desc: 'Upgrade SIMRAD - 3 telas 24" no comando principal e 2 telas 16" no flybridge' },
      { code: 'FY850-OPT-32', name: 'AIS SIMRAD NAIS500', desc: 'AIS SIMRAD NAIS500 (RX-TX)' },
      { code: 'FY850-OPT-33', name: 'Controle OP12 piloto automático', desc: 'Unidade de controle OP12 para piloto automático SIMRAD' },
      { code: 'FY850-OPT-34', name: 'Piso madeira deck principal', desc: 'Piso em madeira no deck principal' },
      { code: 'FY850-OPT-35', name: 'Gaveteiro Minotti salão', desc: 'Gaveteiro Minotti no salão' },
      { code: 'FY850-OPT-36', name: 'Mesa jantar Minotti', desc: 'Mesa de jantar Minotti' },
      { code: 'FY850-OPT-37', name: 'Sofá Minotti salão', desc: 'Sofá Minotti no salão' },
      { code: 'FY850-OPT-38', name: 'Mesa café Minotti', desc: 'Mesa de café Minotti' },
      { code: 'FY850-OPT-39', name: 'Revestimento Florim banheiro master', desc: 'Revestimento em Florim no banheiro da cabine master (piso, paredes e bancada)' },
      { code: 'FY850-OPT-40', name: 'Cozinha Ernestomeda', desc: 'Cozinha Ernestomeda' },
      { code: 'FY850-OPT-41', name: 'Espreguiçadeiras Flybridge', desc: 'Espreguiçadeiras no Flybridge (3)' },
      { code: 'FY850-OPT-42', name: 'Sofá adicional boreste flybridge', desc: 'Sofá adicional a boreste no flybridge' },
      { code: 'FY850-OPT-43', name: 'Upgrade revestimentos externos', desc: 'Upgrade de revestimentos externos (solários e sofás – tecidos Roda)' },
      { code: 'FY850-OPT-44', name: 'Capas cobertura externa', desc: 'Capas avulsas de cobertura externa (sofás, comando)' },
      { code: 'FY850-OPT-45', name: 'Sistema lançamento tender', desc: 'Sistema de lançamento de tender na garagem' },
      { code: 'FY850-OPT-46', name: 'Pintura cinza buzina', desc: 'Pintura cinza da buzina' },
      { code: 'FY850-OPT-47', name: 'Pintura cinza radar', desc: 'Pintura cinza de radar' },
      { code: 'FY850-OPT-48', name: 'Pintura cinza antena SAT', desc: 'Pintura cinza de antena SAT (inclusive no domo vazio)' },
      { code: 'FY850-OPT-49', name: 'Pintura cinza antena VHF', desc: 'Pintura cinza de antena VHF' },
      { code: 'FY850-OPT-50', name: 'Domo vazio simetria', desc: 'Domo vazio (para simetria na targa)' }
    ]

    // Inserir opcionais
    const optionsToInsert = options.map(opt => ({
      yacht_model_id: yachtModelId,
      category_id: categoryId,
      code: opt.code,
      name: opt.name,
      description: opt.desc,
      base_price: 0, // Preço a definir
      delivery_days_impact: 0,
      is_active: true
    }))

    const { error: insertError } = await supabase
      .from('options')
      .insert(optionsToInsert)

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${options.length} opcionais criados com sucesso!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})