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

    // Memorial Items - CONVÉS PRINCIPAL (equipamentos)
    const convesItems = [
      { name: 'Acesso ao flybridge', desc: 'Acesso ao flybridge por escada de aço inox e degraus de teca com corrimão em aço inox', spec: 'Material: aço inox, Degraus: teca' },
      { name: 'Acesso a plataforma de popa', desc: 'Acesso a plataforma de popa por degraus de teca e corrimão em aço inox', spec: 'Degraus: teca, Corrimão: aço inox' },
      { name: 'Acesso a praça de máquinas', desc: 'Acesso a praça de máquinas por porta a bombordo e escotilha no cockpit e escada de aço inox e degraus de teca', spec: 'Material: aço inox e teca' },
      { name: 'Garagem de popa', desc: 'Garagem de popa com iluminação', spec: 'Com iluminação' },
      { name: 'Pega-mão de popa', desc: 'Pega-mão de popa com cunhos (2)', spec: 'Quantidade: 2' },
      { name: 'Porta de correr de vidro', desc: 'Porta de correr de vidro com armação de aço inox', spec: 'Material: vidro, Armação: aço inox' },
      { name: 'Croque de amarração', desc: 'Croque de amarração (2)', spec: 'Quantidade: 2' },
      { name: 'Passa-cabos de proa', desc: 'Passa-cabos de proa em inox (2)', spec: 'Material: inox, Quantidade: 2' },
      { name: 'Púlpito de proa', desc: 'Púlpito de proa com guarda-corpo', spec: 'Com guarda-corpo' },
      { name: 'Bow thruster', desc: 'Bow thruster (hidráulico de 30hp)', spec: 'Tipo: hidráulico, Potência: 30hp' },
      { name: 'Âncoras Bruce', desc: 'Ancoras Bruce (50Kg e 30Kg) com 2 correntes (100 m e 75 m, 12mm diâmetro)', spec: 'Pesos: 50kg e 30kg, Correntes: 100m e 75m, Diâmetro: 12mm' },
      { name: 'Cadeiras no Cockpit', desc: 'Cadeiras no Cockpit (4)', spec: 'Quantidade: 4' },
      { name: 'Defensas cilíndricas', desc: 'Defensas cilíndricas (8)', spec: 'Quantidade: 8' },
      { name: 'Guinchos de ancora elétricos', desc: 'Guinchos de ancora elétricos (2 x 2700 W) com controle na proa, comando principal e comando do flybridge', spec: 'Potência: 2x2700W, Controles: 3' },
      { name: 'Porta da Garagem', desc: 'Porta da Garagem eletro-hidráulica submersível com revestimento de teca na parte interna', spec: 'Tipo: eletro-hidráulica, Revestimento: teca' },
      { name: 'Alarme acústico de água', desc: 'Alarme acústico externo para nível de água de porão localizados na proa e popa', spec: 'Locais: proa e popa' },
      { name: 'Capas para defensas', desc: 'Capas para defensas (10) com logo Ferretti Yachts', spec: 'Quantidade: 10, Logo: Ferretti Yachts' },
      { name: 'Guinchos de amarração', desc: 'Guinchos de amarração com controle de pé (2x 1500 W)', spec: 'Potência: 2x1500W, Controle: de pé' },
      { name: 'Escotilhas de acesso ao bico de proa', desc: 'Escotilhas de acesso ao bico de proa (2)', spec: 'Quantidade: 2' },
      { name: 'Icemaker no Cockpit', desc: 'Icemaker no Cockpit', spec: 'Localização: cockpit' },
      { name: 'Luzes indiretas convés', desc: 'Luzes indiretas nas laterais do convés e proa', spec: 'Tipo: indiretas, Locais: laterais e proa' },
      { name: 'Iluminação no cockpit', desc: 'Iluminação no cockpit', spec: 'Localização: cockpit' },
      { name: 'Iluminação passagens laterais', desc: 'Iluminação nas laterais de passagem', spec: 'Localização: laterais' },
      { name: 'Living e solário na proa', desc: 'Living e solário na proa com sofás, paióis para armazenamento, capas e mesa', spec: 'Inclui: sofás, paióis, capas, mesa' },
      { name: 'Porta-cabos bico de proa', desc: 'Porta-cabos no bico de proa', spec: 'Localização: bico de proa' },
      { name: 'Cabos de amarração', desc: 'Cabos de amarração (72 m)', spec: 'Comprimento: 72m' },
      { name: 'Postos de amarração', desc: 'Postos de amarração (2) com capas de fibra e paióis para armazenamento de cabos', spec: 'Quantidade: 2, Com paióis' },
      { name: 'Trilho para capa de cobertura', desc: 'Trilho para capa de cobertura (cockpit e passagens laterais)', spec: 'Locais: cockpit e passagens' },
      { name: 'Tela de proteção para-brisa', desc: 'Tela de proteção para para-brisa e janelas laterais da casaria', spec: 'Locais: para-brisa e janelas laterais' },
      { name: 'Puxadores desligamento emergência', desc: 'Puxadores na casa de máquinas para desligamento de motores e ativação do sistema de extinção de incêndio', spec: 'Função: desligamento motores e extinção incêndio' },
      { name: 'Passa-cabos com roletes', desc: 'Passa-cabos com roletes, na popa (2), proa (3), mangueiras de incêndio de água salgada e lavador de âncora', spec: 'Popa: 2, Proa: 3' },
      { name: 'Cabo de energia de cais', desc: 'Cabo de energia de cais (230 V, 15m)', spec: 'Voltagem: 230V, Comprimento: 15m' },
      { name: 'Chuveiro plataforma popa', desc: 'Chuveiro com água quente e fria (acesso degrau na plataforma de popa)', spec: 'Água: quente e fria' },
      { name: 'Porta de saída lateral', desc: 'Porta de saída lateral (2)', spec: 'Quantidade: 2' },
      { name: 'Pia praça de popa', desc: 'Pia com água quente e fria na praça de popa', spec: 'Água: quente e fria' },
      { name: 'Ferragens em aço inox', desc: 'Ferragens em aço inox', spec: 'Material: aço inox' },
      { name: 'Cunhos em aço inox', desc: 'Cunhos em aço inox: popa (4), meia-nau (2), e proa (3)', spec: 'Popa: 4, Meia-nau: 2, Proa: 3' },
      { name: 'Sofá de popa', desc: 'Sofá de popa com encosto reposicionável para uso como solário', spec: 'Encosto reposicionável' },
      { name: 'Paiol no suporte de boreste', desc: 'Paiol no suporte de boreste', spec: 'Localização: boreste' },
      { name: 'Solário na proa', desc: 'Solário na proa com colchão e almofadas e paióis', spec: 'Inclui: colchão, almofadas, paióis' },
      { name: 'Plataforma de popa', desc: 'Plataforma de popa Eletro-hidráulica dobrável, com revestimento de teca', spec: 'Tipo: eletro-hidráulica, Revestimento: teca' },
      { name: 'Mesa do cockpit', desc: 'Mesa do cockpit em teca', spec: 'Material: teca' },
      { name: 'Teca no piso do convés', desc: 'Teca no piso do convés principal', spec: 'Material: teca' },
      { name: 'Passarela eletro-hidráulica', desc: 'Passarela eletro-hidráulica com revestimento de teca e controle remoto (2) e hastes de guarda corpo com levantamento automático', spec: 'Controles remotos: 2, Guarda corpo automático' },
      { name: 'Caixas de som cockpit', desc: 'Caixas de som a prova d\'água (2) no cockpit com amplificador e controle remoto', spec: 'Quantidade: 2, Prova d\'água, Com amplificador' }
    ]

    // Salão (conforto/acabamento)
    const salaoItems = [
      { name: 'Porta manual do salão', desc: 'Porta manual do salão deslizante em vidro temperado com estrutura em aço inox', spec: 'Material: vidro temperado, Estrutura: aço inox', category: 'acabamento' },
      { name: 'Ar-condicionado salão', desc: 'Ar-condicionado', spec: 'Tipo: ar-condicionado', category: 'conforto' },
      { name: 'Móvel bar', desc: 'Móvel bar', spec: '', category: 'acabamento' },
      { name: 'Armário com prateleiras salão', desc: 'Armário com prateleiras', spec: '', category: 'acabamento' },
      { name: 'Iluminação cortesia salão', desc: 'Iluminação de teto de cortesia', spec: 'Tipo: cortesia', category: 'eletrica' },
      { name: 'Resfriador de gaveta', desc: 'Resfriador de gaveta (lt75 24V)', spec: 'Capacidade: 75lt, Voltagem: 24V', category: 'conforto' },
      { name: 'Carpete salão', desc: 'Carpete', spec: '', category: 'acabamento' },
      { name: 'Sistema de som salão', desc: 'Sistema de som', spec: '', category: 'eletrica' },
      { name: 'Área de estar', desc: 'Área de estar (sofá, mesa de café)', spec: 'Inclui: sofá e mesa de café', category: 'acabamento' },
      { name: 'Cortinas porta traseira', desc: 'Cortinas padrão na porta traseira', spec: '', category: 'acabamento' },
      { name: 'Cortinas janelas laterais salão', desc: 'Cortinas padrão nas janelas laterais', spec: '', category: 'acabamento' },
      { name: 'TV LED 40" salão', desc: 'TV LED 40" ou equivalente', spec: 'Tamanho: 40"', category: 'eletrica' }
    ]

    // Área de Jantar (acabamento)
    const jantarItems = [
      { name: 'Acesso à cozinha', desc: 'Acesso à cozinha (porta de correr)', spec: 'Tipo: porta de correr', category: 'acabamento' },
      { name: 'Ar condicionado jantar', desc: 'Ar condicionado', spec: '', category: 'conforto' },
      { name: 'Estantes jantar', desc: 'Estantes (2)', spec: 'Quantidade: 2', category: 'acabamento' },
      { name: 'Cadeiras e louças', desc: 'Cadeiras (8), louça de mesa, copos e talheres de aço inoxidável, para 12', spec: 'Cadeiras: 8, Serviço: 12 pessoas', category: 'acabamento' },
      { name: 'Cristaleira', desc: 'Cristaleira', spec: '', category: 'acabamento' },
      { name: 'Mesa de jantar', desc: 'Mesa de jantar', spec: '', category: 'acabamento' },
      { name: 'Carpete jantar', desc: 'Carpete', spec: '', category: 'acabamento' },
      { name: 'Cortinas janelas jantar', desc: 'Cortinas padrão nas janelas laterais', spec: '', category: 'acabamento' },
      { name: 'Degraus madeira convés inferior', desc: 'Degraus de madeira para o convés inferior', spec: 'Material: madeira', category: 'acabamento' }
    ]

    // Lavabo (hidraulica)
    const lavaboItems = [
      { name: 'Vaso elétrico lavabo', desc: 'Vaso elétrico de cerâmica com água fresca', spec: 'Material: cerâmica, Tipo: elétrico', category: 'hidraulica' },
      { name: 'Exaustor lavabo', desc: 'Exaustor', spec: '', category: 'hidraulica' },
      { name: 'Espelho lavabo', desc: 'Espelho', spec: '', category: 'acabamento' },
      { name: 'Persianas lavabo', desc: 'Persianas', spec: '', category: 'acabamento' },
      { name: 'Lavatório lavabo', desc: 'Lavatório', spec: '', category: 'hidraulica' },
      { name: 'Painel controle vaso lavabo', desc: 'Painel de controle do vaso sanitário com indicador (3/4 e cheio)', spec: 'Indicadores: 3/4 e cheio', category: 'eletrica' },
      { name: 'Pavimento madeira lavabo', desc: 'Pavimento de madeira', spec: 'Material: madeira', category: 'acabamento' }
    ]

    // Área da Cozinha (acabamento)
    const areaCozinhaItems = [
      { name: 'Acesso jantar cozinha', desc: 'Acesso à área de jantar (porta de correr)', spec: 'Tipo: porta de correr', category: 'acabamento' },
      { name: 'Painel elétrico cozinha', desc: 'Painel elétrico', spec: '', category: 'eletrica' },
      { name: 'Carpete cozinha', desc: 'Carpete', spec: '', category: 'acabamento' },
      { name: 'Porta saída lateral cozinha', desc: 'Porta de saída lateral manual, porta deslizante de acesso a cozinha e degraus de madeira', spec: 'Tipo: manual e deslizante', category: 'acabamento' },
      { name: 'Degraus madeira leme', desc: 'Degraus de madeira com corrimão de aço inoxidável na posição elevada do leme principal', spec: 'Material: madeira, Corrimão: aço inox', category: 'acabamento' }
    ]

    // Inserir todos os memorial items do convés (categoria: equipamentos)
    const memorialItemsConves = convesItems.map(item => ({
      yacht_model_id: yachtModelId,
      category: 'equipamentos',
      item_name: item.name,
      description: item.desc,
      brand: item.spec,
      display_order: 0,
      is_customizable: true,
      is_active: true
    }))

    const memorialItemsSalao = salaoItems.map(item => ({
      yacht_model_id: yachtModelId,
      category: item.category || 'conforto',
      item_name: item.name,
      description: item.desc,
      brand: item.spec,
      display_order: 0,
      is_customizable: true,
      is_active: true
    }))

    const memorialItemsJantar = jantarItems.map(item => ({
      yacht_model_id: yachtModelId,
      category: item.category || 'acabamento',
      item_name: item.name,
      description: item.desc,
      brand: item.spec,
      display_order: 0,
      is_customizable: true,
      is_active: true
    }))

    const memorialItemsLavabo = lavaboItems.map(item => ({
      yacht_model_id: yachtModelId,
      category: item.category || 'hidraulica',
      item_name: item.name,
      description: item.desc,
      brand: item.spec,
      display_order: 0,
      is_customizable: true,
      is_active: true
    }))

    const memorialItemsAreaCozinha = areaCozinhaItems.map(item => ({
      yacht_model_id: yachtModelId,
      category: item.category || 'acabamento',
      item_name: item.name,
      description: item.desc,
      brand: item.spec,
      display_order: 0,
      is_customizable: true,
      is_active: true
    }))

    // Inserir em lotes
    const allMemorialItems = [
      ...memorialItemsConves,
      ...memorialItemsSalao,
      ...memorialItemsJantar,
      ...memorialItemsLavabo,
      ...memorialItemsAreaCozinha
    ]

    const { error: insertError } = await supabase
      .from('memorial_items')
      .insert(allMemorialItems)

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${allMemorialItems.length} memorial items criados com sucesso!`
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