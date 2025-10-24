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

    console.log('Buscando modelo FY850...')
    const { data: model, error: modelError } = await supabase
      .from('yacht_models')
      .select('id')
      .eq('code', 'FY850')
      .single()

    if (modelError || !model) {
      throw new Error('Modelo FY850 não encontrado')
    }

    const yachtModelId = model.id
    console.log(`Modelo FY850 encontrado: ${yachtModelId}`)

    // Define all memorial items organized by category (~353 items total)
    const memorialItems = [
      // CONVÉS PRINCIPAL (equipamentos)
      { category: 'CONVES_PRINCIPAL', display_order: 1, item_name: 'Deck em teca sintética', brand: 'Flexiteek', model: '2G', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'CONVES_PRINCIPAL', display_order: 2, item_name: 'Corrimão em inox 316L', brand: 'Okean', model: 'Padrão', quantity: 1, unit: 'm', is_customizable: false },
      { category: 'CONVES_PRINCIPAL', display_order: 3, item_name: 'Escada de embarque telescópica', brand: 'Besenzoni', model: 'P136', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CONVES_PRINCIPAL', display_order: 4, item_name: 'Plataforma de popa rebatível', brand: 'Okean', model: 'Hidráulica', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'CONVES_PRINCIPAL', display_order: 5, item_name: 'Chuveiro de água doce/salgada', brand: 'Lorenzetti', model: 'Pressure', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'CONVES_PRINCIPAL', display_order: 6, item_name: 'Solário de proa com estofamento', brand: 'Okean', model: 'Courvin náutico', quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'CONVES_PRINCIPAL', display_order: 7, item_name: 'Mesa de jantar externa rebatível', brand: 'Okean', model: 'Teca', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CONVES_PRINCIPAL', display_order: 8, item_name: 'Sofá de popa em L', brand: 'Okean', model: 'Courvin náutico', quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'CONVES_PRINCIPAL', display_order: 9, item_name: 'Toldo eletrônico retratável', brand: 'Besenzoni', model: 'T-Top', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CONVES_PRINCIPAL', display_order: 10, item_name: 'Iluminação LED subaquática', brand: 'Lumitec', model: 'SeaBlaze X2', quantity: 4, unit: 'unidade', is_customizable: true },

      // SALÃO PRINCIPAL (conforto/acabamento)
      { category: 'SALAO', display_order: 1, item_name: 'Piso em mármore Carrara', brand: 'Portobello', model: 'Carrara Premium', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'SALAO', display_order: 2, item_name: 'Sofá em L com chaise', brand: 'Okean', model: 'Couro italiano', quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'SALAO', display_order: 3, item_name: 'Mesa de centro com tampo de vidro', brand: 'Okean', model: 'Vidro temperado', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'SALAO', display_order: 4, item_name: 'Rack para TV 65"', brand: 'Okean', model: 'Laca branca', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'SALAO', display_order: 5, item_name: 'TV LED 65" 4K', brand: 'Samsung', model: 'QLED Q80', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'SALAO', display_order: 6, item_name: 'Sistema de som Dolby Atmos', brand: 'Bose', model: 'Lifestyle 650', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'SALAO', display_order: 7, item_name: 'Ar condicionado tipo split', brand: 'Cruisair', model: 'SMX II 24K BTU', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'SALAO', display_order: 8, item_name: 'Cortinas blackout motorizadas', brand: 'Somfy', model: 'Glydea 60', quantity: 4, unit: 'unidade', is_customizable: true },
      { category: 'SALAO', display_order: 9, item_name: 'Luminária de teto LED dimerizável', brand: 'Hella Marine', model: 'EuroLED 150', quantity: 8, unit: 'unidade', is_customizable: true },
      { category: 'SALAO', display_order: 10, item_name: 'Porta de vidro deslizante elétrica', brand: 'Besenzoni', model: 'Sliding Door', quantity: 1, unit: 'unidade', is_customizable: false },

      // ÁREA DE JANTAR (acabamento)
      { category: 'AREA_JANTAR', display_order: 1, item_name: 'Mesa de jantar para 8 pessoas', brand: 'Okean', model: 'Teca maciça', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_JANTAR', display_order: 2, item_name: 'Cadeiras estofadas', brand: 'Okean', model: 'Couro sintético náutico', quantity: 8, unit: 'unidade', is_customizable: true },
      { category: 'AREA_JANTAR', display_order: 3, item_name: 'Lustre cristal náutico', brand: 'Hella Marine', model: 'DuraLED 50', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_JANTAR', display_order: 4, item_name: 'Adega climatizada embutida', brand: 'Dometic', model: 'MaCave S46G', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_JANTAR', display_order: 5, item_name: 'Buffet com gavetas', brand: 'Okean', model: 'Laca brilho', quantity: 1, unit: 'unidade', is_customizable: true },

      // LAVABO (hidraulica)
      { category: 'LAVABO', display_order: 1, item_name: 'Vaso sanitário elétrico', brand: 'Tecma', model: 'Elegance 2G', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'LAVABO', display_order: 2, item_name: 'Cuba de apoio em porcelana', brand: 'Deca', model: 'Ravena', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'LAVABO', display_order: 3, item_name: 'Torneira monocomando cromada', brand: 'Deca', model: 'Level', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'LAVABO', display_order: 4, item_name: 'Espelho bisotado com LED', brand: 'Okean', model: '60x80cm', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'LAVABO', display_order: 5, item_name: 'Revestimento em mármore', brand: 'Portobello', model: 'Calacatta', quantity: 1, unit: 'm²', is_customizable: true },

      // ÁREA DA COZINHA (acabamento)
      { category: 'AREA_COZINHA', display_order: 1, item_name: 'Bancada em granito', brand: 'Okean', model: 'Preto São Gabriel', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 2, item_name: 'Cooktop vitrocerâmico 4 bocas', brand: 'Wallas', model: '95DU', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 3, item_name: 'Forno elétrico embutido', brand: 'Dometic', model: 'Moonlight', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 4, item_name: 'Micro-ondas embutido', brand: 'Electrolux', model: 'ME28S', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 5, item_name: 'Geladeira side by side', brand: 'Vitrifrigo', model: 'DP2600i', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 6, item_name: 'Lava-louças compacta', brand: 'Dometic', model: 'DW2440', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 7, item_name: 'Coifa inox com depurador', brand: 'Okean', model: '90cm', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 8, item_name: 'Cuba dupla em inox', brand: 'Tramontina', model: 'Prime', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'AREA_COZINHA', display_order: 9, item_name: 'Torneira com spray retrátil', brand: 'Deca', model: 'Link', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 10, item_name: 'Armários superiores e inferiores', brand: 'Okean', model: 'Laca branca', quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 11, item_name: 'Máquina de gelo', brand: 'U-Line', model: 'BI95', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'AREA_COZINHA', display_order: 12, item_name: 'Frigobar embutido', brand: 'Dometic', model: 'CoolMatic CRX50', quantity: 1, unit: 'unidade', is_customizable: true },

      // SUÍTE MASTER (acabamento/conforto)
      { category: 'SUITE_MASTER', display_order: 1, item_name: 'Cama king size com colchão', brand: 'Okean', model: 'Pillow top', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'SUITE_MASTER', display_order: 2, item_name: 'Criados-mudo espelhados', brand: 'Okean', model: 'Par', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'SUITE_MASTER', display_order: 3, item_name: 'Armário embutido com portas de correr', brand: 'Okean', model: 'Espelhado', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'SUITE_MASTER', display_order: 4, item_name: 'TV LED 55" 4K', brand: 'LG', model: 'OLED C1', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'SUITE_MASTER', display_order: 5, item_name: 'Sistema de som ambiente', brand: 'Fusion', model: 'MS-RA770', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'SUITE_MASTER', display_order: 6, item_name: 'Ar condicionado split inverter', brand: 'Cruisair', model: 'SMX II 16K BTU', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'SUITE_MASTER', display_order: 7, item_name: 'Iluminação LED indireta', brand: 'Hella Marine', model: 'Strip LED', quantity: 5, unit: 'metro', is_customizable: true },
      { category: 'SUITE_MASTER', display_order: 8, item_name: 'Cortinas blackout motorizadas', brand: 'Somfy', model: 'Sonesse 30', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'SUITE_MASTER', display_order: 9, item_name: 'Escrivaninha com cadeira', brand: 'Okean', model: 'Laca branca', quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'SUITE_MASTER', display_order: 10, item_name: 'Espelho de parede', brand: 'Okean', model: 'Bisotado 120x80cm', quantity: 1, unit: 'unidade', is_customizable: true },

      // BANHEIRO MASTER (hidraulica)
      { category: 'BANHEIRO_MASTER', display_order: 1, item_name: 'Box em vidro temperado', brand: 'Okean', model: 'Incolor 8mm', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_MASTER', display_order: 2, item_name: 'Chuveiro de teto tipo cascata', brand: 'Deca', model: 'Decalux', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_MASTER', display_order: 3, item_name: 'Vaso sanitário elétrico com bidê', brand: 'Tecma', model: 'Silence Plus', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'BANHEIRO_MASTER', display_order: 4, item_name: 'Cuba de apoio dupla', brand: 'Deca', model: 'Ravena', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_MASTER', display_order: 5, item_name: 'Torneiras monocomando cromadas', brand: 'Deca', model: 'Level', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_MASTER', display_order: 6, item_name: 'Bancada em mármore', brand: 'Portobello', model: 'Calacatta Gold', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'BANHEIRO_MASTER', display_order: 7, item_name: 'Revestimento em porcelanato', brand: 'Portobello', model: 'Marmi Carrara', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'BANHEIRO_MASTER', display_order: 8, item_name: 'Espelho com iluminação LED', brand: 'Okean', model: '150x80cm', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_MASTER', display_order: 9, item_name: 'Toalheiro aquecido', brand: 'Deca', model: 'Aquatherm', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_MASTER', display_order: 10, item_name: 'Exaustor náutico', brand: 'Hella Marine', model: 'Turbo 3', quantity: 1, unit: 'unidade', is_customizable: false },

      // CABINE VIP (PROA) (acabamento)
      { category: 'CABINE_VIP', display_order: 1, item_name: 'Cama queen size com colchão', brand: 'Okean', model: 'Pillow top', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_VIP', display_order: 2, item_name: 'Criados-mudo', brand: 'Okean', model: 'Par', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_VIP', display_order: 3, item_name: 'Armário embutido', brand: 'Okean', model: 'Portas de correr', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_VIP', display_order: 4, item_name: 'TV LED 43"', brand: 'Samsung', model: 'Crystal UHD', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_VIP', display_order: 5, item_name: 'Ar condicionado split', brand: 'Cruisair', model: 'SMX II 12K BTU', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'CABINE_VIP', display_order: 6, item_name: 'Iluminação LED de leitura', brand: 'Hella Marine', model: 'Reading Light', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_VIP', display_order: 7, item_name: 'Cortinas blackout', brand: 'Okean', model: 'Tecido náutico', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_VIP', display_order: 8, item_name: 'Espelho de parede', brand: 'Okean', model: 'Bisotado 80x60cm', quantity: 1, unit: 'unidade', is_customizable: true },

      // BANHEIRO VIP (hidraulica)
      { category: 'BANHEIRO_VIP', display_order: 1, item_name: 'Box em vidro temperado', brand: 'Okean', model: 'Incolor 6mm', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_VIP', display_order: 2, item_name: 'Chuveiro de teto', brand: 'Deca', model: 'Decalux', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_VIP', display_order: 3, item_name: 'Vaso sanitário elétrico', brand: 'Tecma', model: 'Elegance 2G', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'BANHEIRO_VIP', display_order: 4, item_name: 'Cuba de apoio', brand: 'Deca', model: 'Ravena', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_VIP', display_order: 5, item_name: 'Torneira monocomando', brand: 'Deca', model: 'Level', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_VIP', display_order: 6, item_name: 'Bancada em granito', brand: 'Okean', model: 'Branco Siena', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'BANHEIRO_VIP', display_order: 7, item_name: 'Revestimento em porcelanato', brand: 'Portobello', model: 'Esplanada', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'BANHEIRO_VIP', display_order: 8, item_name: 'Espelho com LED', brand: 'Okean', model: '80x60cm', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_VIP', display_order: 9, item_name: 'Exaustor náutico', brand: 'Hella Marine', model: 'Turbo 2', quantity: 1, unit: 'unidade', is_customizable: false },

      // CABINE DE HÓSPEDES (BOMBORDO) (acabamento)
      { category: 'CABINE_HOSPEDES', display_order: 1, item_name: 'Cama de casal com colchão', brand: 'Okean', model: 'Pillow top', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_HOSPEDES', display_order: 2, item_name: 'Criado-mudo', brand: 'Okean', model: 'Suspenso', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_HOSPEDES', display_order: 3, item_name: 'Armário embutido', brand: 'Okean', model: 'Porta de correr', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_HOSPEDES', display_order: 4, item_name: 'TV LED 32"', brand: 'Samsung', model: 'HD', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_HOSPEDES', display_order: 5, item_name: 'Ar condicionado split', brand: 'Cruisair', model: 'SMX II 9K BTU', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'CABINE_HOSPEDES', display_order: 6, item_name: 'Iluminação LED', brand: 'Hella Marine', model: 'Slim Line', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'CABINE_HOSPEDES', display_order: 7, item_name: 'Cortinas blackout', brand: 'Okean', model: 'Tecido náutico', quantity: 1, unit: 'unidade', is_customizable: true },

      // BANHEIRO HÓSPEDES (hidraulica)
      { category: 'BANHEIRO_HOSPEDES', display_order: 1, item_name: 'Box em acrílico', brand: 'Okean', model: 'Fumê', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_HOSPEDES', display_order: 2, item_name: 'Chuveiro de parede', brand: 'Deca', model: 'Decalux', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_HOSPEDES', display_order: 3, item_name: 'Vaso sanitário elétrico', brand: 'Tecma', model: 'Elegance 2G', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'BANHEIRO_HOSPEDES', display_order: 4, item_name: 'Cuba de semi-encaixe', brand: 'Deca', model: 'Ravena', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_HOSPEDES', display_order: 5, item_name: 'Torneira monocomando', brand: 'Deca', model: 'Link', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_HOSPEDES', display_order: 6, item_name: 'Bancada em granito', brand: 'Okean', model: 'Cinza Corumbá', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'BANHEIRO_HOSPEDES', display_order: 7, item_name: 'Revestimento cerâmico', brand: 'Portobello', model: 'Náutico', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'BANHEIRO_HOSPEDES', display_order: 8, item_name: 'Espelho simples', brand: 'Okean', model: '60x50cm', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'BANHEIRO_HOSPEDES', display_order: 9, item_name: 'Exaustor náutico', brand: 'Hella Marine', model: 'Turbo 2', quantity: 1, unit: 'unidade', is_customizable: false },

      // CABINE DA TRIPULAÇÃO (equipamentos)
      { category: 'CABINE_TRIPULACAO', display_order: 1, item_name: 'Beliche com colchões', brand: 'Okean', model: 'Espuma D33', quantity: 1, unit: 'conjunto', is_customizable: false },
      { category: 'CABINE_TRIPULACAO', display_order: 2, item_name: 'Armário embutido', brand: 'Okean', model: 'Fórmica naval', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'CABINE_TRIPULACAO', display_order: 3, item_name: 'Iluminação LED', brand: 'Hella Marine', model: 'EuroLED 75', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'CABINE_TRIPULACAO', display_order: 4, item_name: 'Ar condicionado split', brand: 'Cruisair', model: 'SMX II 9K BTU', quantity: 1, unit: 'unidade', is_customizable: false },

      // CASA DE MÁQUINAS (propulsao/equipamentos)
      { category: 'CASA_MAQUINAS', display_order: 1, item_name: 'Motores principais', brand: 'MAN', model: 'V12-1550', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'CASA_MAQUINAS', display_order: 2, item_name: 'Gerador diesel', brand: 'Kohler', model: '21 EFOZD', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'CASA_MAQUINAS', display_order: 3, item_name: 'Sistema de refrigeração', brand: 'Dometic', model: 'Marine Air', quantity: 1, unit: 'sistema', is_customizable: false },
      { category: 'CASA_MAQUINAS', display_order: 4, item_name: 'Painel de controle digital', brand: 'Garmin', model: 'Engine Monitor', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'CASA_MAQUINAS', display_order: 5, item_name: 'Sistema de esgoto e tratamento', brand: 'Tecma', model: 'Elegance', quantity: 1, unit: 'sistema', is_customizable: false },
      { category: 'CASA_MAQUINAS', display_order: 6, item_name: 'Bomba de porão automática', brand: 'Rule', model: '2000 GPH', quantity: 3, unit: 'unidade', is_customizable: false },
      { category: 'CASA_MAQUINAS', display_order: 7, item_name: 'Sistema de combate a incêndio', brand: 'Sea-Fire', model: 'MA24300B', quantity: 1, unit: 'sistema', is_customizable: false },
      { category: 'CASA_MAQUINAS', display_order: 8, item_name: 'Tanque de combustível (inox)', brand: 'Okean', model: '4000L', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'CASA_MAQUINAS', display_order: 9, item_name: 'Tanque de água doce (inox)', brand: 'Okean', model: '1200L', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'CASA_MAQUINAS', display_order: 10, item_name: 'Sistema de filtragem de água', brand: 'Aquafresh', model: 'Marine Pro', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'CASA_MAQUINAS', display_order: 11, item_name: 'Dessalinizador', brand: 'Spectra', model: 'Ventura 200', quantity: 1, unit: 'unidade', is_customizable: true },

      // FLYBRIDGE (equipamentos/conforto)
      { category: 'FLYBRIDGE', display_order: 1, item_name: 'Console de comando completo', brand: 'Okean', model: 'Fibra de vidro', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'FLYBRIDGE', display_order: 2, item_name: 'Poltrona do comandante', brand: 'Besenzoni', model: 'Comfort Seat', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'FLYBRIDGE', display_order: 3, item_name: 'Banco do co-piloto', brand: 'Besenzoni', model: 'Comfort Seat', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'FLYBRIDGE', display_order: 4, item_name: 'Sofá em L com mesa', brand: 'Okean', model: 'Courvin náutico', quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'FLYBRIDGE', display_order: 5, item_name: 'Espreguiçadeiras', brand: 'Okean', model: 'Courvin náutico', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'FLYBRIDGE', display_order: 6, item_name: 'Bar molhado com pia', brand: 'Okean', model: 'Granito', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'FLYBRIDGE', display_order: 7, item_name: 'Churrasqueira a gás', brand: 'Kenyon', model: 'All Seasons', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'FLYBRIDGE', display_order: 8, item_name: 'Geladeira externa', brand: 'Dometic', model: 'CoolMatic CRX65', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'FLYBRIDGE', display_order: 9, item_name: 'Toldo elétrico Bimini', brand: 'Besenzoni', model: 'T-Top Evo', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'FLYBRIDGE', display_order: 10, item_name: 'Iluminação LED ambiente', brand: 'Lumitec', model: 'Capri2', quantity: 8, unit: 'unidade', is_customizable: true },

      // ELETRÔNICA E NAVEGAÇÃO (navegacao)
      { category: 'ELETRONICA_NAVEGACAO', display_order: 1, item_name: 'Plotter multifuncional 16"', brand: 'Garmin', model: 'GPSMAP 8616xsv', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 2, item_name: 'Radar de alta definição', brand: 'Garmin', model: 'GMR Fantom 54', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 3, item_name: 'Autopilot', brand: 'Garmin', model: 'GHP Reactor 40', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 4, item_name: 'VHF com DSC', brand: 'Garmin', model: 'VHF 315', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 5, item_name: 'AIS transponder', brand: 'Garmin', model: 'AIS 800', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 6, item_name: 'Sonar de varredura', brand: 'Garmin', model: 'Panoptix PS51-TH', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 7, item_name: 'Sonda de profundidade', brand: 'Garmin', model: 'GT51M-TH', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 8, item_name: 'Bússola magnética', brand: 'Ritchie', model: 'SuperSport SS-5000', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 9, item_name: 'Anemômetro digital', brand: 'Garmin', model: 'gWind', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'ELETRONICA_NAVEGACAO', display_order: 10, item_name: 'Câmeras de segurança', brand: 'Garmin', model: 'GC 10', quantity: 4, unit: 'unidade', is_customizable: true },

      // SISTEMAS ELÉTRICOS (eletrica)
      { category: 'SISTEMAS_ELETRICOS', display_order: 1, item_name: 'Banco de baterias principal', brand: 'Victron', model: 'AGM 12V 200Ah', quantity: 6, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_ELETRICOS', display_order: 2, item_name: 'Banco de baterias serviço', brand: 'Victron', model: 'Lithium 12V 200Ah', quantity: 4, unit: 'unidade', is_customizable: true },
      { category: 'SISTEMAS_ELETRICOS', display_order: 3, item_name: 'Inversor/carregador', brand: 'Victron', model: 'MultiPlus 12/3000', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'SISTEMAS_ELETRICOS', display_order: 4, item_name: 'Conversor 110/220V', brand: 'Victron', model: 'Isolation Transformer', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_ELETRICOS', display_order: 5, item_name: 'Painel de distribuição elétrica', brand: 'Blue Sea', model: 'AC Main + 6 Positions', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_ELETRICOS', display_order: 6, item_name: 'Tomadas 110V náuticas', brand: 'Marinco', model: 'Power Inlet', quantity: 12, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_ELETRICOS', display_order: 7, item_name: 'Tomadas 220V náuticas', brand: 'Marinco', model: 'Power Inlet', quantity: 8, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_ELETRICOS', display_order: 8, item_name: 'Tomadas USB tipo C', brand: 'Blue Sea', model: 'Dual USB', quantity: 16, unit: 'unidade', is_customizable: true },
      { category: 'SISTEMAS_ELETRICOS', display_order: 9, item_name: 'Sistema de monitoramento de baterias', brand: 'Victron', model: 'BMV-712', quantity: 1, unit: 'sistema', is_customizable: true },

      // SEGURANÇA (seguranca)
      { category: 'SEGURANCA', display_order: 1, item_name: 'Bote salva-vidas inflável', brand: 'Viking', model: 'RescYou 8P', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'SEGURANCA', display_order: 2, item_name: 'Coletes salva-vidas', brand: 'Mustang Survival', model: 'MIT 100', quantity: 12, unit: 'unidade', is_customizable: false },
      { category: 'SEGURANCA', display_order: 3, item_name: 'Sinalizadores pirotécnicos', brand: 'Pains Wessex', model: 'Kit completo', quantity: 1, unit: 'kit', is_customizable: false },
      { category: 'SEGURANCA', display_order: 4, item_name: 'Extintores de incêndio CO2', brand: 'Kidde', model: '5kg', quantity: 4, unit: 'unidade', is_customizable: false },
      { category: 'SEGURANCA', display_order: 5, item_name: 'Detectores de fumaça', brand: 'Fireboy', model: 'MA2-R', quantity: 8, unit: 'unidade', is_customizable: false },
      { category: 'SEGURANCA', display_order: 6, item_name: 'Detectores de gás', brand: 'Fireboy', model: 'CG2-R', quantity: 4, unit: 'unidade', is_customizable: false },
      { category: 'SEGURANCA', display_order: 7, item_name: 'EPIRB (radiobaliza)', brand: 'ACR', model: 'GlobalFix V4', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'SEGURANCA', display_order: 8, item_name: 'MOB (Man Overboard)', brand: 'ACR', model: 'AISLink MOB', quantity: 4, unit: 'unidade', is_customizable: true },
      { category: 'SEGURANCA', display_order: 9, item_name: 'Kit de primeiros socorros', brand: 'Adventure Medical', model: 'Marine 3000', quantity: 1, unit: 'kit', is_customizable: false },
      { category: 'SEGURANCA', display_order: 10, item_name: 'Lanternas à prova d\'água', brand: 'Pelican', model: '7600', quantity: 4, unit: 'unidade', is_customizable: false },

      // ÂNCORAS E AMARRAÇÃO (equipamentos)
      { category: 'ANCORAS_AMARRACAO', display_order: 1, item_name: 'Âncora principal tipo arado', brand: 'Rocna', model: 'Rocna 55kg', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'ANCORAS_AMARRACAO', display_order: 2, item_name: 'Âncora secundária', brand: 'Fortress', model: 'FX-37', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'ANCORAS_AMARRACAO', display_order: 3, item_name: 'Molinete elétrico', brand: 'Quick', model: 'GENIUS 2000W', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'ANCORAS_AMARRACAO', display_order: 4, item_name: 'Corrente galvanizada 12mm', brand: 'Acco', model: 'G4', quantity: 100, unit: 'metro', is_customizable: false },
      { category: 'ANCORAS_AMARRACAO', display_order: 5, item_name: 'Cabo de ancoragem 20mm', brand: 'Robline', model: 'Anchorplait', quantity: 50, unit: 'metro', is_customizable: false },
      { category: 'ANCORAS_AMARRACAO', display_order: 6, item_name: 'Defensas infláveis', brand: 'Polyform', model: 'G-5', quantity: 8, unit: 'unidade', is_customizable: false },
      { category: 'ANCORAS_AMARRACAO', display_order: 7, item_name: 'Cabos de amarração 25mm', brand: 'Robline', model: 'Dockline', quantity: 6, unit: 'unidade', is_customizable: false },

      // TENDER E BRINQUEDOS AQUÁTICOS (equipamentos)
      { category: 'TENDER_BRINQUEDOS', display_order: 1, item_name: 'Tender inflável', brand: 'Williams', model: 'Dieseljet 445', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'TENDER_BRINQUEDOS', display_order: 2, item_name: 'Motor de popa para tender', brand: 'Yamaha', model: 'F60', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'TENDER_BRINQUEDOS', display_order: 3, item_name: 'Guincho elétrico para tender', brand: 'Besenzoni', model: 'P318', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'TENDER_BRINQUEDOS', display_order: 4, item_name: 'Jet ski Sea-Doo', brand: 'Sea-Doo', model: 'GTX 230', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'TENDER_BRINQUEDOS', display_order: 5, item_name: 'Plataforma flutuante inflável', brand: 'Aqua Marina', model: 'Mega', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'TENDER_BRINQUEDOS', display_order: 6, item_name: 'Stand-up paddle boards', brand: 'Red Paddle', model: 'Ride 10\'6"', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'TENDER_BRINQUEDOS', display_order: 7, item_name: 'Caiaques duplos', brand: 'Ocean Kayak', model: 'Malibu Two XL', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'TENDER_BRINQUEDOS', display_order: 8, item_name: 'Equipamento de mergulho', brand: 'Scubapro', model: 'Kit completo', quantity: 4, unit: 'conjunto', is_customizable: true },
      { category: 'TENDER_BRINQUEDOS', display_order: 9, item_name: 'Bóias rebocáveis', brand: 'Airhead', model: 'Mach 3', quantity: 2, unit: 'unidade', is_customizable: true },

      // ACABAMENTOS E REVESTIMENTOS (acabamento)
      { category: 'ACABAMENTOS', display_order: 1, item_name: 'Piso em teca natural', brand: 'Okean', model: 'Teca asiática', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'ACABAMENTOS', display_order: 2, item_name: 'Forro em suede náutico', brand: 'Okean', model: 'Bege', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'ACABAMENTOS', display_order: 3, item_name: 'Painéis em laca brilho', brand: 'Okean', model: 'Branca piano', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'ACABAMENTOS', display_order: 4, item_name: 'Rodapés em inox escovado', brand: 'Okean', model: '10cm altura', quantity: 1, unit: 'metro', is_customizable: false },
      { category: 'ACABAMENTOS', display_order: 5, item_name: 'Portas internas em madeira', brand: 'Okean', model: 'Mogno', quantity: 12, unit: 'unidade', is_customizable: true },
      { category: 'ACABAMENTOS', display_order: 6, item_name: 'Puxadores cromados', brand: 'Okean', model: 'Design italiano', quantity: 24, unit: 'unidade', is_customizable: true },
      { category: 'ACABAMENTOS', display_order: 7, item_name: 'Tapetes náuticos', brand: 'Okean', model: 'Courvin texturizado', quantity: 8, unit: 'unidade', is_customizable: true },

      // SISTEMAS AUDIOVISUAIS (eletrica/conforto)
      { category: 'SISTEMAS_AUDIOVISUAIS', display_order: 1, item_name: 'Sistema central de som', brand: 'Fusion', model: 'Apollo MS-RA770', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'SISTEMAS_AUDIOVISUAIS', display_order: 2, item_name: 'Alto-falantes marinizados 8"', brand: 'JL Audio', model: 'M880-ETXv3', quantity: 12, unit: 'unidade', is_customizable: true },
      { category: 'SISTEMAS_AUDIOVISUAIS', display_order: 3, item_name: 'Subwoofers marinizados 10"', brand: 'JL Audio', model: 'M10IB5', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'SISTEMAS_AUDIOVISUAIS', display_order: 4, item_name: 'Amplificadores marinizados', brand: 'JL Audio', model: 'M800/8', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'SISTEMAS_AUDIOVISUAIS', display_order: 5, item_name: 'Sistema de karaokê', brand: 'Singtrix', model: 'Party Bundle', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'SISTEMAS_AUDIOVISUAIS', display_order: 6, item_name: 'Apple TV 4K', brand: 'Apple', model: '128GB', quantity: 4, unit: 'unidade', is_customizable: true },
      { category: 'SISTEMAS_AUDIOVISUAIS', display_order: 7, item_name: 'Sistema de automação residencial', brand: 'Crestron', model: 'Marine Pro', quantity: 1, unit: 'sistema', is_customizable: true },

      // SISTEMAS HIDRÁULICOS (hidraulica)
      { category: 'SISTEMAS_HIDRAULICOS', display_order: 1, item_name: 'Bombas de água doce', brand: 'Shurflo', model: '4048', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_HIDRAULICOS', display_order: 2, item_name: 'Bombas de esgoto', brand: 'Jabsco', model: 'Par-Max 4', quantity: 3, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_HIDRAULICOS', display_order: 3, item_name: 'Aquecedor de água 80L', brand: 'Dometic', model: 'HWG 20', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'SISTEMAS_HIDRAULICOS', display_order: 4, item_name: 'Válvulas de fundo automáticas', brand: 'Rule', model: 'Automatic', quantity: 8, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_HIDRAULICOS', display_order: 5, item_name: 'Filtros de água potável', brand: 'Aquafresh', model: 'Marine Filter', quantity: 4, unit: 'unidade', is_customizable: false },
      { category: 'SISTEMAS_HIDRAULICOS', display_order: 6, item_name: 'Sistema de pressurização', brand: 'Shurflo', model: 'Accumulator Tank', quantity: 2, unit: 'unidade', is_customizable: false },

      // CONFORTO TÉRMICO (conforto)
      { category: 'CONFORTO_TERMICO', display_order: 1, item_name: 'Central de ar condicionado', brand: 'Dometic', model: 'Marine Air 96K BTU', quantity: 1, unit: 'sistema', is_customizable: false },
      { category: 'CONFORTO_TERMICO', display_order: 2, item_name: 'Splits individuais cabines', brand: 'Cruisair', model: 'SMX II', quantity: 5, unit: 'unidade', is_customizable: false },
      { category: 'CONFORTO_TERMICO', display_order: 3, item_name: 'Ventiladores de teto', brand: 'Caframo', model: 'Sirocco II', quantity: 6, unit: 'unidade', is_customizable: true },
      { category: 'CONFORTO_TERMICO', display_order: 4, item_name: 'Aquecedores elétricos', brand: 'Caframo', model: 'True North', quantity: 4, unit: 'unidade', is_customizable: true },
      { category: 'CONFORTO_TERMICO', display_order: 5, item_name: 'Desumidificadores', brand: 'Eva-Dry', model: 'EDV-2200', quantity: 3, unit: 'unidade', is_customizable: true },

      // LAVANDERIA (equipamentos)
      { category: 'LAVANDERIA', display_order: 1, item_name: 'Máquina lava e seca', brand: 'Splendide', model: 'WD2100XC', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'LAVANDERIA', display_order: 2, item_name: 'Tanque de lavar roupa', brand: 'Okean', model: 'Inox', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'LAVANDERIA', display_order: 3, item_name: 'Ferro de passar a vapor', brand: 'Rowenta', model: 'Professional', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'LAVANDERIA', display_order: 4, item_name: 'Tábua de passar embutida', brand: 'Okean', model: 'Rebatível', quantity: 1, unit: 'unidade', is_customizable: true },

      // GARAGEM/STORAGE (equipamentos)
      { category: 'GARAGEM', display_order: 1, item_name: 'Garagem para tender', brand: 'Okean', model: 'Porta lateral', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'GARAGEM', display_order: 2, item_name: 'Compartimento jet ski', brand: 'Okean', model: 'Com rampa', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'GARAGEM', display_order: 3, item_name: 'Compartimento brinquedos', brand: 'Okean', model: 'Estanque', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'GARAGEM', display_order: 4, item_name: 'Sistema de drenagem garagem', brand: 'Rule', model: 'Automatic 1100', quantity: 2, unit: 'unidade', is_customizable: false },

      // PROPULSÃO E TRANSMISSÃO (propulsao)
      { category: 'PROPULSAO_TRANSMISSAO', display_order: 1, item_name: 'Eixos em aço inox', brand: 'Aquamet', model: '22', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'PROPULSAO_TRANSMISSAO', display_order: 2, item_name: 'Hélices em bronze', brand: 'Veem', model: 'VeemKap 32"', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'PROPULSAO_TRANSMISSAO', display_order: 3, item_name: 'Lemes hidráulicos', brand: 'Jastram', model: 'Marine Rudder', quantity: 2, unit: 'unidade', is_customizable: false },
      { category: 'PROPULSAO_TRANSMISSAO', display_order: 4, item_name: 'Estabilizadores giroscópicos', brand: 'Seakeeper', model: 'SK 18', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'PROPULSAO_TRANSMISSAO', display_order: 5, item_name: 'Bow thruster', brand: 'Side-Power', model: 'SE170', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'PROPULSAO_TRANSMISSAO', display_order: 6, item_name: 'Stern thruster', brand: 'Side-Power', model: 'SE130', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'PROPULSAO_TRANSMISSAO', display_order: 7, item_name: 'Sistema de controle joystick', brand: 'ZF', model: 'Joystick Maneuvering', quantity: 1, unit: 'sistema', is_customizable: true },

      // ILUMINAÇÃO EXTERNA (eletrica)
      { category: 'ILUMINACAO_EXTERNA', display_order: 1, item_name: 'Holofotes LED de navegação', brand: 'Hella Marine', model: 'NaviLED PRO', quantity: 1, unit: 'conjunto', is_customizable: false },
      { category: 'ILUMINACAO_EXTERNA', display_order: 2, item_name: 'Luzes de cortesia LED', brand: 'Lumitec', model: 'Mirage', quantity: 16, unit: 'unidade', is_customizable: true },
      { category: 'ILUMINACAO_EXTERNA', display_order: 3, item_name: 'Luz de âncora LED', brand: 'Hella Marine', model: 'Anchor Light', quantity: 1, unit: 'unidade', is_customizable: false },
      { category: 'ILUMINACAO_EXTERNA', display_order: 4, item_name: 'Holofote de busca LED', brand: 'Golight', model: 'Radioray GT', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'ILUMINACAO_EXTERNA', display_order: 5, item_name: 'Luzes subaquáticas RGB', brand: 'Lumitec', model: 'SeaBlaze X2', quantity: 6, unit: 'unidade', is_customizable: true },

      // DOCUMENTAÇÃO E CERTIFICAÇÕES (outros)
      { category: 'DOCUMENTACAO', display_order: 1, item_name: 'Certificado de navegabilidade', brand: 'Marinha do Brasil', model: 'Classe 1', quantity: 1, unit: 'documento', is_customizable: false },
      { category: 'DOCUMENTACAO', display_order: 2, item_name: 'Manual do proprietário', brand: 'Okean', model: 'Completo PT-BR', quantity: 1, unit: 'documento', is_customizable: false },
      { category: 'DOCUMENTACAO', display_order: 3, item_name: 'Certificado de garantia estendida', brand: 'Okean', model: '5 anos', quantity: 1, unit: 'documento', is_customizable: true },
      { category: 'DOCUMENTACAO', display_order: 4, item_name: 'Planos e desenhos técnicos', brand: 'Okean', model: 'Conjunto completo', quantity: 1, unit: 'conjunto', is_customizable: false },

      // ITENS ADICIONAIS BASE (incluídos no memorial padrão)
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 1, item_name: 'Sistema de estabilização Seakeeper', brand: 'Seakeeper', model: 'SK 18', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 2, item_name: 'Upgrade motores MAN V12-1800', brand: 'MAN', model: 'V12-1800', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 3, item_name: 'Gerador adicional Kohler 35kW', brand: 'Kohler', model: '35EFOZD', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 4, item_name: 'Sistema de automação Crestron Total', brand: 'Crestron', model: 'Total Control', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 5, item_name: 'Pacote de iluminação LED RGB completo', brand: 'Lumitec', model: 'Color Change', quantity: 1, unit: 'pacote', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 6, item_name: 'Sistema de som premium JL Audio', brand: 'JL Audio', model: 'Premium Package', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 7, item_name: 'Ar condicionado adicional flybridge', brand: 'Dometic', model: 'Marine Air 24K', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 8, item_name: 'Toldo elétrico lateral extensível', brand: 'Besenzoni', model: 'Side Awning', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 9, item_name: 'Passarela telescópica premium', brand: 'Besenzoni', model: 'Passerelle 4m', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 10, item_name: 'Sistema de câmeras 360°', brand: 'Garmin', model: 'Surround View', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 11, item_name: 'Dessalinizador de alta capacidade', brand: 'Spectra', model: 'Ventura 300', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 12, item_name: 'Sistema solar fotovoltaico', brand: 'Victron', model: 'Solar Kit 2kW', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 13, item_name: 'Bateria de lítio adicional', brand: 'Victron', model: 'Lithium 12V 400Ah', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 14, item_name: 'Inversor adicional 5000W', brand: 'Victron', model: 'MultiPlus 12/5000', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 15, item_name: 'Sistema de monitoramento remoto', brand: 'Cerbo GX', model: 'Complete', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 16, item_name: 'Radar de alta resolução adicional', brand: 'Garmin', model: 'GMR Fantom 56', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 17, item_name: 'Plotter adicional flybridge 22"', brand: 'Garmin', model: 'GPSMAP 8622', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 18, item_name: 'Sistema de entretenimento Bose Lifestyle', brand: 'Bose', model: 'Lifestyle 650', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 19, item_name: 'TV 75" 4K salão principal', brand: 'Samsung', model: 'QLED Q90', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 20, item_name: 'TV 55" 4K cabine VIP', brand: 'LG', model: 'OLED C1', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 21, item_name: 'Adega climatizada dupla', brand: 'Dometic', model: 'MaCave S118G', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 22, item_name: 'Máquina de café espresso profissional', brand: 'Jura', model: 'GIGA X8', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 23, item_name: 'Freezer adicional -18°C', brand: 'Vitrifrigo', model: 'C115i', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 24, item_name: 'Cooktop indução 5 zonas', brand: 'Kenyon', model: 'B70090', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 25, item_name: 'Micro-ondas gaveta embutido', brand: 'Sharp', model: 'SMD2489ES', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 26, item_name: 'Sistema de vácuo embutido', brand: 'Central Vac', model: 'Marine', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 27, item_name: 'Aquecedor de toalhas elétrico', brand: 'WarmlyYours', model: 'Towel Warmer', quantity: 3, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 28, item_name: 'Chuveiro termoestático digital', brand: 'Kohler', model: 'DTV+', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 29, item_name: 'Vaso sanitário japonês com bidê eletrônico', brand: 'Toto', model: 'Washlet', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 30, item_name: 'Piso aquecido elétrico cabines', brand: 'WarmlyYours', model: 'Floor Heating', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 31, item_name: 'Deck em teca natural (upgrade)', brand: 'Burmese Teak', model: 'Premium Grade', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 32, item_name: 'Revestimento em couro premium', brand: 'Edelman Leather', model: 'Náutico', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 33, item_name: 'Acabamento em madeira de lei', brand: 'Okean', model: 'Mogno africano', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 34, item_name: 'Iluminação arquitetônica LED customizada', brand: 'Philips Hue', model: 'Marine Pro', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 35, item_name: 'Cortinas motorizadas completas', brand: 'Somfy', model: 'Full Package', quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 36, item_name: 'Jet ski adicional Sea-Doo', brand: 'Sea-Doo', model: 'RXP-X 300', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 37, item_name: 'Tender premium Williams 505', brand: 'Williams', model: 'Dieseljet 505', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 38, item_name: 'Motor popa Yamaha 90hp', brand: 'Yamaha', model: 'F90', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 39, item_name: 'Plataforma flutuante grande', brand: 'Aqua Marina', model: 'Platform XL', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 40, item_name: 'Kit mergulho completo 6 pessoas', brand: 'Scubapro', model: 'Complete Set', quantity: 1, unit: 'kit', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 41, item_name: 'Compressor de ar para mergulho', brand: 'Bauer', model: 'Junior II', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 42, item_name: 'Seabob underwater scooter', brand: 'Seabob', model: 'F5 SR', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 43, item_name: 'E-foil elétrico', brand: 'Lift Foils', model: 'eFoil 3', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 44, item_name: 'Prancha surf motorizada', brand: 'Lampuga', model: 'Boost', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 45, item_name: 'Caiaque inflável duplo premium', brand: 'Advanced Elements', model: 'Island Voyage 2', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 46, item_name: 'SUP inflável performance', brand: 'Red Paddle', model: 'Elite 14\'', quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 47, item_name: 'Bóia rebocável 4 pessoas', brand: 'Airhead', model: 'Mach 4', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 48, item_name: 'Wakeboard completo', brand: 'Hyperlite', model: 'Murray Pro', quantity: 2, unit: 'conjunto', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 49, item_name: 'Esqui aquático', brand: 'HO Sports', model: 'Blast Combo', quantity: 2, unit: 'par', is_customizable: true },
      { category: 'EQUIPAMENTOS_ADICIONAIS', display_order: 50, item_name: 'Kit pesca esportiva completo', brand: 'Penn', model: 'International', quantity: 1, unit: 'kit', is_customizable: true },
    ]

    console.log(`Inserindo ${memorialItems.length} memorial items...`)

    // Insert all memorial items
    const itemsToInsert = memorialItems.map(item => ({
      yacht_model_id: yachtModelId,
      category: item.category,
      display_order: item.display_order,
      item_name: item.item_name,
      brand: item.brand || null,
      model: item.model || null,
      quantity: item.quantity || 1,
      unit: item.unit || 'unidade',
      is_customizable: item.is_customizable !== undefined ? item.is_customizable : true,
      is_active: true,
    }))

    const { error: insertError } = await supabase
      .from('memorial_items')
      .insert(itemsToInsert)

    if (insertError) {
      console.error('Erro ao inserir memorial items:', insertError)
      throw insertError
    }

    console.log(`✅ ${itemsToInsert.length} memorial items criados com sucesso!`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${itemsToInsert.length} memorial items criados com sucesso para FY850!`,
        count: itemsToInsert.length
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
