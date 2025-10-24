import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting FY850 memorial population...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o yacht_model_id do FY850
    const { data: yachtModel, error: modelError } = await supabase
      .from('yacht_models')
      .select('id')
      .eq('code', 'FY850')
      .single();

    if (modelError) {
      console.error('Error fetching yacht model:', modelError);
      throw new Error(`Yacht model FY850 not found: ${modelError.message}`);
    }

    const yachtModelId = yachtModel.id;
    console.log('Found FY850 yacht model ID:', yachtModelId);

    // Deletar itens existentes antes de popular novamente
    const { error: deleteError } = await supabase
      .from('memorial_items')
      .delete()
      .eq('yacht_model_id', yachtModelId);

    if (deleteError) {
      console.error('Error deleting existing items:', deleteError);
    } else {
      console.log('Deleted existing memorial items for FY850');
    }

    // Memorial completo do FY850 com 413 itens
    const memorialItems = [
      // ===== CONVÉS PRINCIPAL (47 itens) =====
      { category: 'conves_principal', display_order: 1, item_name: 'Acesso ao flybridge', description: 'Escada de aço inox e degraus de teca com corrimão em aço inox', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 2, item_name: 'Acesso à plataforma de popa', description: 'Degraus de teca e corrimão em aço inox', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 3, item_name: 'Acesso à praça de máquinas', description: 'Porta a bombordo e escotilha no cockpit com escada de aço inox e degraus de teca', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 4, item_name: 'Garagem de popa', description: 'Com iluminação', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 5, item_name: 'Pega-mão de popa', description: 'Com cunhos', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 6, item_name: 'Porta de correr de vidro', description: 'Com armação de aço inox', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 7, item_name: 'Croque de amarração', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 8, item_name: 'Passa-cabos de proa em inox', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 9, item_name: 'Púlpito de proa', description: 'Com guarda-corpo', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 10, item_name: 'Bow thruster', description: 'Hidráulico de 30hp', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 11, item_name: 'Âncoras Bruce', description: '50Kg e 30Kg com 2 correntes (100m e 75m, 12mm diâmetro)', brand: 'Bruce', model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 12, item_name: 'Cadeiras no Cockpit', description: null, brand: null, model: null, quantity: 4, unit: 'unidade' },
      { category: 'conves_principal', display_order: 13, item_name: 'Defensas cilíndricas', description: null, brand: null, model: null, quantity: 8, unit: 'unidade' },
      { category: 'conves_principal', display_order: 14, item_name: 'Guinchos de âncora elétricos', description: '2x 2700W com controle na proa, comando principal e flybridge', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 15, item_name: 'Porta da Garagem', description: 'Eletro-hidráulica submersível com revestimento de teca na parte interna', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 16, item_name: 'Alarme acústico externo', description: 'Para nível de água de porão localizados na proa e popa', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 17, item_name: 'Capas para defensas', description: 'Com logo Ferretti Yachts', brand: null, model: null, quantity: 10, unit: 'unidade' },
      { category: 'conves_principal', display_order: 18, item_name: 'Guinchos de amarração', description: 'Com controle de pé (2x 1500W)', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 19, item_name: 'Escotilhas de acesso ao bico de proa', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 20, item_name: 'Icemaker no Cockpit', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 21, item_name: 'Luzes indiretas', description: 'Nas laterais do convés e proa', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 22, item_name: 'Iluminação no cockpit', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 23, item_name: 'Iluminação nas laterais de passagem', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 24, item_name: 'Living e solário na proa', description: 'Com sofás, paióis para armazenamento, capas e mesa', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 25, item_name: 'Porta-cabos no bico de proa', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 26, item_name: 'Cabos de amarração', description: '72m', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 27, item_name: 'Postos de amarração', description: 'Com capas de fibra e paióis para armazenamento de cabos', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 28, item_name: 'Trilho para capa de cobertura', description: 'Cockpit e passagens laterais', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 29, item_name: 'Tela de proteção', description: 'Para para-brisa e janelas laterais da casaria', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 30, item_name: 'Puxadores na casa de máquinas', description: 'Para desligamento de motores e ativação do sistema de extinção de incêndio', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 31, item_name: 'Passa-cabos com roletes', description: 'Na popa (2), proa (3), mangueiras de incêndio de água salgada e lavador de âncora', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 32, item_name: 'Cabo de energia de cais', description: '230V, 15m', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 33, item_name: 'Chuveiro com água quente e fria', description: 'Acesso degrau na plataforma de popa', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 34, item_name: 'Porta de saída lateral', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 35, item_name: 'Pia com água quente e fria', description: 'Na praça de popa', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 36, item_name: 'Ferragens em aço inox', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'conves_principal', display_order: 37, item_name: 'Cunhos em aço inox', description: 'Popa (4), meia-nau (2), e proa (3)', brand: null, model: null, quantity: 9, unit: 'unidade' },
      { category: 'conves_principal', display_order: 38, item_name: 'Sofá de popa', description: 'Com encosto reposicionável para uso como solário', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 39, item_name: 'Paiol no suporte de boreste', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 40, item_name: 'Solário na proa', description: 'Com colchão e almofadas e paióis', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 41, item_name: 'Plataforma de popa', description: 'Eletro-hidráulica dobrável, com revestimento de teca', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 42, item_name: 'Mesa do cockpit em teca', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 43, item_name: 'Teca no piso do convés principal', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'conves_principal', display_order: 44, item_name: 'Passarela eletro-hidráulica', description: 'Com revestimento de teca e controle remoto (2) e hastes de guarda corpo com levantamento automático', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'conves_principal', display_order: 45, item_name: 'Caixas de som à prova d\'água', description: 'No cockpit com amplificador e controle remoto', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'conves_principal', display_order: 46, item_name: '[OPCIONAL] Capota rígida para tender', description: 'Proteção UV e chuva para tender na garagem', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'conves_principal', display_order: 47, item_name: '[OPCIONAL] Suporte para jet ski', description: 'Sistema de lançamento e armazenamento para moto aquática', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },

      // ===== SALÃO (12 itens) =====
      { category: 'salao', display_order: 1, item_name: 'Porta manual do salão', description: 'Deslizante em vidro temperado com estrutura em aço inox', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 2, item_name: 'Ar-condicionado', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'salao', display_order: 3, item_name: 'Móvel bar', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 4, item_name: 'Armário com prateleiras', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 5, item_name: 'Iluminação de teto de cortesia', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'salao', display_order: 6, item_name: 'Resfriador de gaveta', description: '75L 24V', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 7, item_name: 'Rádio/MP3 player', description: 'Com amplificador e caixas de som', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 8, item_name: 'Sofá em L', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 9, item_name: 'Mesa dobrável', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 10, item_name: 'Painel de controle ar-condicionado', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 11, item_name: 'TV LED 48"', description: 'Com sistema de som integrado', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'salao', display_order: 12, item_name: 'Tapete náutico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },

      // ===== ÁREA DE JANTAR (9 itens) =====
      { category: 'area_jantar', display_order: 1, item_name: 'Mesa de jantar', description: 'Para 8 pessoas', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_jantar', display_order: 2, item_name: 'Cadeiras estofadas', description: null, brand: null, model: null, quantity: 8, unit: 'unidade' },
      { category: 'area_jantar', display_order: 3, item_name: 'Lustre de teto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_jantar', display_order: 4, item_name: 'Armário com espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_jantar', display_order: 5, item_name: 'Cristaleira', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_jantar', display_order: 6, item_name: 'Iluminação ambiente LED', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'area_jantar', display_order: 7, item_name: 'Persianas blackout', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'area_jantar', display_order: 8, item_name: 'Sistema de som ambiente', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_jantar', display_order: 9, item_name: 'Piso em madeira nobre', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },

      // ===== LAVABO (7 itens) =====
      { category: 'lavabo', display_order: 1, item_name: 'Vaso sanitário elétrico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lavabo', display_order: 2, item_name: 'Cuba de apoio', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lavabo', display_order: 3, item_name: 'Torneira monocomando', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lavabo', display_order: 4, item_name: 'Espelho com iluminação LED', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lavabo', display_order: 5, item_name: 'Bancada em mármore', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lavabo', display_order: 6, item_name: 'Porta-toalhas em inox', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lavabo', display_order: 7, item_name: 'Ventilação forçada', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },

      // ===== ÁREA DA COZINHA (5 itens) =====
      { category: 'area_cozinha', display_order: 1, item_name: 'Fogão cooktop a gás', description: '4 bocas', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_cozinha', display_order: 2, item_name: 'Forno elétrico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_cozinha', display_order: 3, item_name: 'Microondas embutido', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_cozinha', display_order: 4, item_name: 'Coifa de exaustão', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'area_cozinha', display_order: 5, item_name: 'Iluminação de trabalho LED', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },

      // ===== COZINHA/GALLEY (15 itens) =====
      { category: 'cozinha_galley', display_order: 1, item_name: 'Bancada em granito', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'cozinha_galley', display_order: 2, item_name: 'Cuba dupla em inox', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 3, item_name: 'Torneira monocomando retrátil', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 4, item_name: 'Geladeira/freezer', description: '220L', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 5, item_name: 'Lava-louças embutida', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 6, item_name: 'Armários superiores', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cozinha_galley', display_order: 7, item_name: 'Gavetas com sistema soft-close', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cozinha_galley', display_order: 8, item_name: 'Despensa organizadora', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 9, item_name: 'Porta-temperos', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 10, item_name: 'Lixeira embutida dupla', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 11, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 4, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 12, item_name: 'Piso antiderrapante', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'cozinha_galley', display_order: 13, item_name: 'Ventilação com exaustor', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 14, item_name: 'Máquina de café expresso embutida', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cozinha_galley', display_order: 15, item_name: 'Adega climatizada 12 garrafas', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },

      // ===== COMANDO PRINCIPAL (23 itens) =====
      { category: 'comando_principal', display_order: 1, item_name: 'Painel de comando em fibra de carbono', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 2, item_name: 'Assento do comandante', description: 'Com ajustes elétricos', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 3, item_name: 'Assento do copiloto', description: 'Com ajustes elétricos', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 4, item_name: 'Volante náutico em couro', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 5, item_name: 'Manetes de controle dos motores', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'comando_principal', display_order: 6, item_name: 'GPS chartplotter 16"', description: null, brand: 'Garmin', model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 7, item_name: 'Radar 48 milhas', description: null, brand: 'Furuno', model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 8, item_name: 'VHF DSC Classe D', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 9, item_name: 'Autopilot digital', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 10, item_name: 'Ecobatímetro/sonar', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 11, item_name: 'AIS receptor Classe B', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 12, item_name: 'Indicadores de tanques', description: 'Combustível e água', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'comando_principal', display_order: 13, item_name: 'Indicadores de trim tabs', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'comando_principal', display_order: 14, item_name: 'Tacômetros digitais', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'comando_principal', display_order: 15, item_name: 'Controle de trim dos motores', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 16, item_name: 'Controle de bow thruster', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 17, item_name: 'Controle de guinchos de âncora', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 18, item_name: 'Limpadores de para-brisa', description: 'Com lavador', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'comando_principal', display_order: 19, item_name: 'Ar-condicionado no comando', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 20, item_name: 'Sistema de som com USB/Bluetooth', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 21, item_name: 'Iluminação de painel LED', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'comando_principal', display_order: 22, item_name: 'Holofote de busca remoto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'comando_principal', display_order: 23, item_name: 'Para-brisa com vidro laminado', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },

      // ===== FLYBRIDGE (45 itens) =====
      { category: 'flybridge', display_order: 1, item_name: 'Console de comando completo', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 2, item_name: 'Poltronas do comandante e copiloto', description: 'Com ajustes elétricos', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'flybridge', display_order: 3, item_name: 'Sofá em U', description: 'Para 8 pessoas', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 4, item_name: 'Mesa conversível em solário', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 5, item_name: 'Espreguiçadeiras na proa', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'flybridge', display_order: 6, item_name: 'Bimini rígido', description: 'Com abertura elétrica', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 7, item_name: 'Wet bar com pia', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 8, item_name: 'Churrasqueira elétrica', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 9, item_name: 'Geladeira 90L', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 10, item_name: 'Icemaker', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 11, item_name: 'Armários de armazenamento', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'flybridge', display_order: 12, item_name: 'GPS chartplotter 12"', description: null, brand: 'Garmin', model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 13, item_name: 'VHF portátil', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 14, item_name: 'Controle de âncora e thrusters', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 15, item_name: 'Tacômetros e indicadores', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'flybridge', display_order: 16, item_name: 'Iluminação LED ambiente', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'flybridge', display_order: 17, item_name: 'Luzes de navegação', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'flybridge', display_order: 18, item_name: 'Sistema de som premium', description: 'Com subwoofer', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 19, item_name: 'TV LED 32"', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 20, item_name: 'Chuveiro com água quente e fria', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 21, item_name: 'Escada de acesso', description: 'Em aço inox com degraus de teca', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 22, item_name: 'Guarda-corpo em aço inox', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'flybridge', display_order: 23, item_name: 'Para-brisa do flybridge', description: 'Com limpadores', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 24, item_name: 'Paiol para armazenamento', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'flybridge', display_order: 25, item_name: 'Capas para almofadas', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'flybridge', display_order: 26, item_name: 'Tomadas 12V e 220V', description: null, brand: null, model: null, quantity: 4, unit: 'unidade' },
      { category: 'flybridge', display_order: 27, item_name: 'Porta-copos embutidos', description: null, brand: null, model: null, quantity: 8, unit: 'unidade' },
      { category: 'flybridge', display_order: 28, item_name: 'Piso antiderrapante', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'flybridge', display_order: 29, item_name: 'Mastro para bandeiras', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'flybridge', display_order: 30, item_name: 'Luzes de cortesia', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'flybridge', display_order: 31, item_name: '[OPCIONAL] Teka no flybridge', description: 'Revestimento em teca sintética Flexiteek', brand: 'Flexiteek', model: '2G', quantity: 1, unit: 'm²', is_customizable: true },
      { category: 'flybridge', display_order: 32, item_name: '[OPCIONAL] BBQ elétrico premium', description: 'Churrasqueira de alto desempenho', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 33, item_name: '[OPCIONAL] Mesa de refeições premium', description: 'Para 8 pessoas com tampo em teca', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 34, item_name: '[OPCIONAL] Geladeira maior 113L', description: 'Upgrade com freezer', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 35, item_name: '[OPCIONAL] Pia com água quente/fria', description: 'Sistema de água quente instantâneo', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 36, item_name: '[OPCIONAL] Espreguiçadeiras ajustáveis premium', description: 'Com ajustes múltiplos', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 37, item_name: '[OPCIONAL] Sofás em L ampliados', description: 'Para 10 pessoas', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'flybridge', display_order: 38, item_name: '[OPCIONAL] Guarda-sol elétrico', description: 'Com abertura e fechamento elétrico', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 39, item_name: '[OPCIONAL] Toldo elétrico retratável', description: 'Com proteção UV', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 40, item_name: '[OPCIONAL] TV LED 32" adicional', description: 'Segunda TV com som integrado', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 41, item_name: '[OPCIONAL] Targa em carbono', description: 'Estrutura em fibra de carbono', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 42, item_name: '[OPCIONAL] Sistema de som premium upgrade', description: 'High-end com amplificador de 1000W', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 43, item_name: '[OPCIONAL] Wet bar completo', description: 'Com tampo em granito e pia dupla', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'flybridge', display_order: 44, item_name: '[OPCIONAL] Iluminação RGB LED', description: 'Controlável via smartphone', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'flybridge', display_order: 45, item_name: '[OPCIONAL] Piso aquecido', description: 'Sistema de aquecimento elétrico', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true },

      // ===== LOBBY CONVÉS INFERIOR (8 itens) =====
      { category: 'lobby_conves_inferior', display_order: 1, item_name: 'Escada de acesso', description: 'Com corrimão em inox', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lobby_conves_inferior', display_order: 2, item_name: 'Iluminação ambiente LED', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'lobby_conves_inferior', display_order: 3, item_name: 'Piso em madeira nobre', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'lobby_conves_inferior', display_order: 4, item_name: 'Espelho decorativo', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lobby_conves_inferior', display_order: 5, item_name: 'Armário de roupas', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lobby_conves_inferior', display_order: 6, item_name: 'Aparador decorativo', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'lobby_conves_inferior', display_order: 7, item_name: 'Ar-condicionado central', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'lobby_conves_inferior', display_order: 8, item_name: 'Painel de controle de iluminação', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },

      // ===== CABINE MASTER (20 itens) =====
      { category: 'cabine_master', display_order: 1, item_name: 'Cama king-size', description: 'Com cabeceira estofada', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 2, item_name: 'Roupeiros com espelhos', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_master', display_order: 3, item_name: 'Criados-mudos', description: 'Com gavetas', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_master', display_order: 4, item_name: 'Penteadeira com espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 5, item_name: 'TV LED 42"', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 6, item_name: 'Sistema de som integrado', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 7, item_name: 'Ar-condicionado individual', description: 'Com controle de temperatura', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 8, item_name: 'Iluminação LED dimmer', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_master', display_order: 9, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_master', display_order: 10, item_name: 'Persianas blackout elétricas', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_master', display_order: 11, item_name: 'Cofre digital', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 12, item_name: 'Espelhos decorativos', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_master', display_order: 13, item_name: 'Porta-joias embutido', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 14, item_name: 'Piso em carpete náutico', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'cabine_master', display_order: 15, item_name: 'Tomadas USB e 220V', description: null, brand: null, model: null, quantity: 6, unit: 'unidade' },
      { category: 'cabine_master', display_order: 16, item_name: 'Painel de controle central', description: 'Iluminação, AC e cortinas', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 17, item_name: 'Gavetas com sistema soft-close', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_master', display_order: 18, item_name: 'Escrivaninha dobrável', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 19, item_name: 'Poltrona de leitura', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_master', display_order: 20, item_name: 'Sistema de alarme de intrusão', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },

      // ===== BANHEIRO MASTER (15 itens) =====
      { category: 'banheiro_master', display_order: 1, item_name: 'Box com porta de vidro', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 2, item_name: 'Ducha rain shower', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 3, item_name: 'Ducha higiênica', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 4, item_name: 'Vaso sanitário elétrico', description: 'Com função bidet', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 5, item_name: 'Cuba de apoio dupla', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 6, item_name: 'Torneiras monocomando premium', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 7, item_name: 'Bancada em mármore', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 8, item_name: 'Espelhos com iluminação LED', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 9, item_name: 'Armário com espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 10, item_name: 'Aquecedor de toalhas elétrico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 11, item_name: 'Piso aquecido', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'banheiro_master', display_order: 12, item_name: 'Ventilação forçada com exaustor', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 13, item_name: 'Porta-toalhas em inox', description: null, brand: null, model: null, quantity: 3, unit: 'unidade' },
      { category: 'banheiro_master', display_order: 14, item_name: 'Saboneteiras e porta-escova', description: null, brand: null, model: null, quantity: 2, unit: 'conjunto' },
      { category: 'banheiro_master', display_order: 15, item_name: 'Lixeira embutida', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },

      // ===== CABINE VIP PROA (18 itens) =====
      { category: 'cabine_vip_proa', display_order: 1, item_name: 'Cama queen-size', description: 'Com cabeceira estofada', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 2, item_name: 'Roupeiro embutido', description: 'Com espelhos', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 3, item_name: 'Criados-mudos', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 4, item_name: 'TV LED 32"', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 5, item_name: 'Sistema de som', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 6, item_name: 'Ar-condicionado individual', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 7, item_name: 'Iluminação LED com dimmer', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_vip_proa', display_order: 8, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 9, item_name: 'Escotilha panorâmica', description: 'Com abertura elétrica', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 10, item_name: 'Persianas blackout', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_vip_proa', display_order: 11, item_name: 'Espelho de parede', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 12, item_name: 'Gavetas com soft-close', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_vip_proa', display_order: 13, item_name: 'Piso em carpete náutico', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'cabine_vip_proa', display_order: 14, item_name: 'Tomadas USB e 220V', description: null, brand: null, model: null, quantity: 4, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 15, item_name: 'Painel de controle integrado', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 16, item_name: 'Prateleiras decorativas', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_vip_proa', display_order: 17, item_name: 'Porta de privacidade', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_vip_proa', display_order: 18, item_name: 'Ventilação natural otimizada', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },

      // ===== BANHEIRO VIP (12 itens) =====
      { category: 'banheiro_vip', display_order: 1, item_name: 'Box com porta de vidro', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 2, item_name: 'Ducha com água quente/fria', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 3, item_name: 'Vaso sanitário elétrico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 4, item_name: 'Cuba de apoio', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 5, item_name: 'Torneira monocomando', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 6, item_name: 'Bancada em mármore', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 7, item_name: 'Espelho com iluminação LED', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 8, item_name: 'Armário de parede', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 9, item_name: 'Ventilação forçada', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 10, item_name: 'Porta-toalhas em inox', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'banheiro_vip', display_order: 11, item_name: 'Saboneteira e acessórios', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'banheiro_vip', display_order: 12, item_name: 'Piso antiderrapante', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },

      // ===== CABINE HÓSPEDES BORESTE (16 itens) =====
      { category: 'cabine_hospedes_boreste', display_order: 1, item_name: 'Camas de solteiro', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 2, item_name: 'Roupeiro embutido', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 3, item_name: 'Criado-mudo', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 4, item_name: 'TV LED 24"', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 5, item_name: 'Ar-condicionado individual', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 6, item_name: 'Iluminação LED', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_hospedes_boreste', display_order: 7, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 8, item_name: 'Vigia com abertura', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 9, item_name: 'Cortinas blackout', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_hospedes_boreste', display_order: 10, item_name: 'Espelho de parede', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 11, item_name: 'Gavetas de armazenamento', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_hospedes_boreste', display_order: 12, item_name: 'Piso em carpete náutico', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'cabine_hospedes_boreste', display_order: 13, item_name: 'Tomadas 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 14, item_name: 'Prateleiras', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_hospedes_boreste', display_order: 15, item_name: 'Porta de privacidade', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_boreste', display_order: 16, item_name: 'Ventilação natural', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },

      // ===== CABINE HÓSPEDES BOMBORDO (16 itens) =====
      { category: 'cabine_hospedes_bombordo', display_order: 1, item_name: 'Camas de solteiro', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 2, item_name: 'Roupeiro embutido', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 3, item_name: 'Criado-mudo', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 4, item_name: 'TV LED 24"', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 5, item_name: 'Ar-condicionado individual', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 6, item_name: 'Iluminação LED', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_hospedes_bombordo', display_order: 7, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 8, item_name: 'Vigia com abertura', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 9, item_name: 'Cortinas blackout', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_hospedes_bombordo', display_order: 10, item_name: 'Espelho de parede', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 11, item_name: 'Gavetas de armazenamento', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_hospedes_bombordo', display_order: 12, item_name: 'Piso em carpete náutico', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'cabine_hospedes_bombordo', display_order: 13, item_name: 'Tomadas 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 14, item_name: 'Prateleiras', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_hospedes_bombordo', display_order: 15, item_name: 'Porta de privacidade', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_hospedes_bombordo', display_order: 16, item_name: 'Ventilação natural', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },

      // ===== BANHEIRO HÓSPEDES COMPARTILHADO (10 itens) =====
      { category: 'banheiro_hospedes_compartilhado', display_order: 1, item_name: 'Box com porta de vidro', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 2, item_name: 'Ducha com água quente/fria', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 3, item_name: 'Vaso sanitário elétrico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 4, item_name: 'Cuba de apoio', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 5, item_name: 'Torneira monocomando', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 6, item_name: 'Bancada em corian', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 7, item_name: 'Espelho com iluminação LED', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 8, item_name: 'Ventilação forçada', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 9, item_name: 'Porta-toalhas em inox', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_hospedes_compartilhado', display_order: 10, item_name: 'Piso antiderrapante', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },

      // ===== CABINE TRIPULAÇÃO (14 itens) =====
      { category: 'cabine_tripulacao', display_order: 1, item_name: 'Beliche de solteiro', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 2, item_name: 'Armário compacto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 3, item_name: 'Gavetas sob a cama', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_tripulacao', display_order: 4, item_name: 'Iluminação LED', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_tripulacao', display_order: 5, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 6, item_name: 'Ar-condicionado', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 7, item_name: 'Vigia com abertura', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 8, item_name: 'Cortina', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 9, item_name: 'Espelho pequeno', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 10, item_name: 'Prateleiras', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'cabine_tripulacao', display_order: 11, item_name: 'Piso em vinil náutico', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },
      { category: 'cabine_tripulacao', display_order: 12, item_name: 'Tomadas 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 13, item_name: 'Porta de acesso independente', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'cabine_tripulacao', display_order: 14, item_name: 'Ventilação natural', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },

      // ===== BANHEIRO TRIPULAÇÃO (8 itens) =====
      { category: 'banheiro_tripulacao', display_order: 1, item_name: 'Box compacto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_tripulacao', display_order: 2, item_name: 'Ducha com água quente/fria', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_tripulacao', display_order: 3, item_name: 'Vaso sanitário elétrico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_tripulacao', display_order: 4, item_name: 'Pia com bancada', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_tripulacao', display_order: 5, item_name: 'Torneira simples', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_tripulacao', display_order: 6, item_name: 'Espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_tripulacao', display_order: 7, item_name: 'Ventilação forçada', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'banheiro_tripulacao', display_order: 8, item_name: 'Piso antiderrapante', description: null, brand: null, model: null, quantity: 1, unit: 'm²' },

      // ===== SALA DE MÁQUINAS (25 itens) =====
      { category: 'sala_maquinas', display_order: 1, item_name: 'Motores MAN V12 1550HP', description: 'Diesel common rail', brand: 'MAN', model: 'V12-1550', quantity: 2, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 2, item_name: 'Geradores diesel', description: '27,5kW/60Hz', brand: 'Kohler', model: null, quantity: 2, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 3, item_name: 'Trim tabs hidráulicos', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'sala_maquinas', display_order: 4, item_name: 'Estabilizadores giroscópicos', description: null, brand: 'Seakeeper', model: '35', quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 5, item_name: 'Central hidráulica', description: 'Para bow thruster e plataforma', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 6, item_name: 'Tanque de combustível', description: 'Em aço inox 5600L', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 7, item_name: 'Tanque de água potável', description: 'Em aço inox 1200L', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 8, item_name: 'Tanque de esgoto', description: '400L', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 9, item_name: 'Bombas de porão automáticas', description: 'Com alarme', brand: null, model: null, quantity: 3, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 10, item_name: 'Bombas de água doce', description: 'Pressurizadas', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 11, item_name: 'Bomba de transferência de combustível', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 12, item_name: 'Sistema de tratamento de esgoto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 13, item_name: 'Watermaker (dessalinizador)', description: '180L/h', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 14, item_name: 'Sistema de resfriamento dos motores', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'sala_maquinas', display_order: 15, item_name: 'Sistema de extinção de incêndio automático', description: 'FM200', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'sala_maquinas', display_order: 16, item_name: 'Ventilação forçada', description: 'Exaustores e ventiladores', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'sala_maquinas', display_order: 17, item_name: 'Isolamento acústico', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'sala_maquinas', display_order: 18, item_name: 'Painel de monitoramento', description: 'Para motores e geradores', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 19, item_name: 'Iluminação de emergência', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'sala_maquinas', display_order: 20, item_name: 'Separador de água e óleo', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 21, item_name: 'Filtros de combustível', description: 'Decantadores Racor', brand: 'Racor', model: null, quantity: 4, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 22, item_name: 'Aquecedor de água elétrico', description: '100L', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 23, item_name: 'Compressor de ar', description: 'Para manutenção', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sala_maquinas', display_order: 24, item_name: 'Sistema de drenagem', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'sala_maquinas', display_order: 25, item_name: 'Kit de ferramentas e peças sobressalentes', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },

      // ===== ELÉTRICA (20 itens) =====
      { category: 'eletrica', display_order: 1, item_name: 'Banco de baterias 24V', description: '800Ah AGM', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'eletrica', display_order: 2, item_name: 'Baterias de partida dos motores', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'eletrica', display_order: 3, item_name: 'Carregadores de bateria inteligentes', description: '100A', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'eletrica', display_order: 4, item_name: 'Inversores 24V/220V', description: '5000W', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'eletrica', display_order: 5, item_name: 'Painel elétrico principal', description: 'Com disjuntores e proteções', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'eletrica', display_order: 6, item_name: 'Transformador isolador', description: '230V/230V 20kVA', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'eletrica', display_order: 7, item_name: 'Sistema de monitoramento de baterias', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'eletrica', display_order: 8, item_name: 'Tomadas de cais 230V/50Hz', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'eletrica', display_order: 9, item_name: 'Cabos de energia de cais', description: '25m cada', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'eletrica', display_order: 10, item_name: 'Disjuntores de proteção', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'eletrica', display_order: 11, item_name: 'Sistema de aterramento', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'eletrica', display_order: 12, item_name: 'Proteção contra raios', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'eletrica', display_order: 13, item_name: 'Painéis de distribuição', description: 'Em cabines e áreas comuns', brand: null, model: null, quantity: 5, unit: 'unidade' },
      { category: 'eletrica', display_order: 14, item_name: 'Iluminação de emergência LED', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'eletrica', display_order: 15, item_name: 'Luzes de navegação LED', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'eletrica', display_order: 16, item_name: 'Luzes subaquáticas LED', description: 'RGB', brand: null, model: null, quantity: 4, unit: 'unidade' },
      { category: 'eletrica', display_order: 17, item_name: 'Sistema de controle central', description: 'Para iluminação e AC', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'eletrica', display_order: 18, item_name: 'Tomadas USB em cabines', description: null, brand: null, model: null, quantity: 12, unit: 'unidade' },
      { category: 'eletrica', display_order: 19, item_name: 'Chave seletora de cais/gerador/inversor', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'eletrica', display_order: 20, item_name: 'Medidor de consumo elétrico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },

      // ===== SEGURANÇA (18 itens) =====
      { category: 'seguranca', display_order: 1, item_name: 'Coletes salva-vidas', description: null, brand: null, model: null, quantity: 12, unit: 'unidade' },
      { category: 'seguranca', display_order: 2, item_name: 'Boia circular com cabo', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'seguranca', display_order: 3, item_name: 'Extintores de incêndio CO2', description: '6kg', brand: null, model: null, quantity: 6, unit: 'unidade' },
      { category: 'seguranca', display_order: 4, item_name: 'Mangueiras de incêndio', description: 'Com bicos', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'seguranca', display_order: 5, item_name: 'Detectores de fumaça', description: null, brand: null, model: null, quantity: 8, unit: 'unidade' },
      { category: 'seguranca', display_order: 6, item_name: 'Alarme de incêndio', description: 'Com central e sirenes', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'seguranca', display_order: 7, item_name: 'Saídas de emergência sinalizadas', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'seguranca', display_order: 8, item_name: 'Lanternas de emergência', description: null, brand: null, model: null, quantity: 6, unit: 'unidade' },
      { category: 'seguranca', display_order: 9, item_name: 'Kit de primeiros socorros', description: 'Completo', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'seguranca', display_order: 10, item_name: 'Sinalizadores pirotécnicos', description: null, brand: null, model: null, quantity: 12, unit: 'unidade' },
      { category: 'seguranca', display_order: 11, item_name: 'Espelho para busca', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'seguranca', display_order: 12, item_name: 'Apito de emergência', description: null, brand: null, model: null, quantity: 3, unit: 'unidade' },
      { category: 'seguranca', display_order: 13, item_name: 'Balsa salva-vidas inflável', description: 'Para 12 pessoas', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'seguranca', display_order: 14, item_name: 'EPIRB (Emergency Position Indicating Radio Beacon)', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'seguranca', display_order: 15, item_name: 'MOB (Man Overboard) system', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'seguranca', display_order: 16, item_name: 'Sistema de CCTV', description: 'Câmeras internas e externas', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'seguranca', display_order: 17, item_name: 'Alarme de intrusão', description: 'Para cabines e garagem', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'seguranca', display_order: 18, item_name: 'Cofre principal', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },

      // ===== TENDER E BRINQUEDOS (8 itens) =====
      { category: 'garagem', display_order: 1, item_name: 'Tender inflável Williams 445', description: 'Com motor Mercury 100HP', brand: 'Williams', model: 'Sportjet 445', quantity: 1, unit: 'unidade' },
      { category: 'garagem', display_order: 2, item_name: 'Jet ski Sea-Doo', description: 'GTX 300', brand: 'Sea-Doo', model: 'GTX 300', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'garagem', display_order: 3, item_name: 'Pranchas de stand-up paddle', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true },
      { category: 'garagem', display_order: 4, item_name: 'Caiaques duplos', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'garagem', display_order: 5, item_name: 'Equipamento de mergulho', description: 'Máscaras, nadadeiras e snorkel', brand: null, model: null, quantity: 6, unit: 'conjunto', is_customizable: true },
      { category: 'garagem', display_order: 6, item_name: 'Boia rebocável', description: 'Para 3 pessoas', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'garagem', display_order: 7, item_name: 'Wakeboard e esqui aquático', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'garagem', display_order: 8, item_name: 'Seabob underwater scooter', description: null, brand: 'Seabob', model: 'F5 SR', quantity: 1, unit: 'unidade', is_customizable: true },

      // ===== CONFORTO TÉRMICO (12 itens) =====
      { category: 'sistema_ar_condicionado', display_order: 1, item_name: 'Sistema de ar-condicionado central', description: '120.000 BTU', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'sistema_ar_condicionado', display_order: 2, item_name: 'Unidades evaporadoras nas cabines', description: null, brand: null, model: null, quantity: 5, unit: 'unidade' },
      { category: 'sistema_ar_condicionado', display_order: 3, item_name: 'Unidade evaporadora no salão', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'sistema_ar_condicionado', display_order: 4, item_name: 'Controles individuais de temperatura', description: null, brand: null, model: null, quantity: 7, unit: 'unidade' },
      { category: 'sistema_ar_condicionado', display_order: 5, item_name: 'Aquecedor de água para chuveiros', description: null, brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'sistema_ar_condicionado', display_order: 6, item_name: 'Piso aquecido nos banheiros', description: null, brand: null, model: null, quantity: 2, unit: 'sistema', is_customizable: true },
      { category: 'sistema_ar_condicionado', display_order: 7, item_name: 'Ventiladores de teto', description: null, brand: null, model: null, quantity: 4, unit: 'unidade' },
      { category: 'sistema_ar_condicionado', display_order: 8, item_name: 'Ventilação natural otimizada', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'sistema_ar_condicionado', display_order: 9, item_name: 'Isolamento térmico do casco', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'sistema_ar_condicionado', display_order: 10, item_name: 'Vidros temperados duplos', description: 'Com proteção UV', brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'sistema_ar_condicionado', display_order: 11, item_name: 'Cortinas térmicas', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto' },
      { category: 'sistema_ar_condicionado', display_order: 12, item_name: 'Sistema de desumidificação', description: null, brand: null, model: null, quantity: 1, unit: 'sistema' },

      // ===== AUDIOVISUAL E ENTRETENIMENTO (15 itens) =====
      { category: 'audiovisual_entretenimento', display_order: 1, item_name: 'Sistema de som integrado', description: 'Com amplificadores e caixas em todas as áreas', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'audiovisual_entretenimento', display_order: 2, item_name: 'Servidor de mídia central', description: 'Para streaming em todas as TVs', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 3, item_name: 'TV LED 65" no salão', description: null, brand: 'Samsung', model: null, quantity: 1, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 4, item_name: 'TV LED 48" na cabine master', description: null, brand: 'Samsung', model: null, quantity: 1, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 5, item_name: 'TV LED 32" nas cabines VIP', description: null, brand: 'Samsung', model: null, quantity: 1, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 6, item_name: 'TV LED 24" nas cabines de hóspedes', description: null, brand: 'Samsung', model: null, quantity: 2, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 7, item_name: 'Soundbar premium no salão', description: null, brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 8, item_name: 'Sistema de karaokê', description: null, brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true },
      { category: 'audiovisual_entretenimento', display_order: 9, item_name: 'Antena parabólica', description: 'Para TV via satélite', brand: null, model: null, quantity: 1, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 10, item_name: 'Sistema de Wi-Fi de alta velocidade', description: 'Com repetidores em todas as áreas', brand: null, model: null, quantity: 1, unit: 'sistema' },
      { category: 'audiovisual_entretenimento', display_order: 11, item_name: 'Console de videogame', description: null, brand: 'PlayStation', model: '5', quantity: 1, unit: 'unidade', is_customizable: true },
      { category: 'audiovisual_entretenimento', display_order: 12, item_name: 'Projetor com tela retrátil', description: 'Para cinema ao ar livre', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true },
      { category: 'audiovisual_entretenimento', display_order: 13, item_name: 'Sistema de controle universal', description: 'Tablet para controle de AV', brand: null, model: null, quantity: 2, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 14, item_name: 'Streaming devices', description: 'Apple TV e Chromecast', brand: null, model: null, quantity: 4, unit: 'unidade' },
      { category: 'audiovisual_entretenimento', display_order: 15, item_name: 'Sistema de intercomunicação', description: 'Entre todas as áreas', brand: null, model: null, quantity: 1, unit: 'sistema' },
    ];

    // Preparar dados para inserção
    const itemsToInsert = memorialItems.map(item => ({
      yacht_model_id: yachtModelId,
      category: item.category,
      display_order: item.display_order,
      item_name: item.item_name,
      description: item.description,
      brand: item.brand,
      model: item.model,
      quantity: item.quantity,
      unit: item.unit,
      is_customizable: item.is_customizable !== undefined ? item.is_customizable : true,
      is_active: true,
    }));

    console.log(`Inserting ${itemsToInsert.length} memorial items...`);

    // Inserir itens no banco
    const { data: insertedItems, error: insertError } = await supabase
      .from('memorial_items')
      .insert(itemsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting memorial items:', insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${insertedItems?.length || 0} memorial items`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Memorial FY850 populated with ${insertedItems?.length || 0} items`,
        itemsCreated: insertedItems?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-fy850-memorial function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
