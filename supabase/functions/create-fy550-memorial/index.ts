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
    console.log('Starting FY550 memorial population...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o yacht_model_id do FY550
    const { data: yachtModel, error: modelError } = await supabase
      .from('yacht_models')
      .select('id')
      .eq('code', 'FY550')
      .single();

    if (modelError) {
      console.error('Error fetching yacht model:', modelError);
      throw new Error(`Yacht model FY550 not found: ${modelError.message}`);
    }

    const yachtModelId = yachtModel.id;
    console.log('Found FY550 yacht model ID:', yachtModelId);

    // Deletar itens existentes antes de popular novamente
    const { error: deleteError } = await supabase
      .from('memorial_items')
      .delete()
      .eq('yacht_model_id', yachtModelId);

    if (deleteError) {
      console.error('Error deleting existing items:', deleteError);
    } else {
      console.log('Deleted existing memorial items for FY550');
    }

    // Memorial completo do FY550 com ~300 itens
    const memorialItems = [
      // ===== DECK PRINCIPAL (34 itens) =====
      { category: 'conves_principal', display_order: 1, item_name: 'Acesso a plataforma de popa', description: 'Por degraus de fibra de vidro', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 2, item_name: 'Escada de acesso praça de máquinas', description: 'Com degraus de teca', brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 3, item_name: 'Degraus de acesso ao flybridge', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 4, item_name: 'Paióis de armazenamento', description: 'Abaixo dos bancos de cockpit', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 5, item_name: 'Paióis de armazenamento', description: 'Na proa', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 6, item_name: 'Escotilhas', description: 'Para acesso a porão na proa', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 7, item_name: 'Ganchos de amarração', description: null, brand: 'Aço inox', model: null, quantity: 6, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 8, item_name: 'Cabos de amarração', description: null, brand: null, model: null, quantity: 4, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 9, item_name: 'Mangueira de água de abastecimento', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 10, item_name: 'Âncora estilo Bruce', description: 'Com 75m de corrente 8mm', brand: null, model: '20kg', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 11, item_name: 'Guinchos de âncora', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 12, item_name: 'Guindaste para tender', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 13, item_name: 'Tender', description: null, brand: null, model: '310cm', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 14, item_name: 'Motor de popa para tender', description: null, brand: null, model: '6HP', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 15, item_name: 'Defensas cilíndricas', description: null, brand: null, model: null, quantity: 6, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 16, item_name: 'Defensas esféricas', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 17, item_name: 'Chuveiro de água quente e fria', description: 'Na plataforma de popa', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 18, item_name: 'Porta água e energia de cais', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 19, item_name: 'Cabo de conexão de cais', description: null, brand: null, model: '230V, 15 metros', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 20, item_name: 'Escada de banho', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 21, item_name: 'Plataforma de popa', description: 'Eletro-hidráulica dobrável', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 22, item_name: 'Pega mão de popa com cunhos', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 23, item_name: 'Corrimão', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 24, item_name: 'Piso de teca', description: 'Em todo deck principal', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 25, item_name: 'Puxador porta casa de máquinas', description: 'Para desligamento emergencial dos motores', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 26, item_name: 'Sofá de popa', description: 'Com almofadas e colchões', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 27, item_name: 'Mesa em fibra de vidro com tampo de madeira', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 28, item_name: 'Banco em fibra de vidro com assento de madeira', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 29, item_name: 'Luzes de cortesia de deck', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 30, item_name: 'Alto-falantes à prova d\'água', description: 'No cockpit', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 31, item_name: 'Limpador de para-brisa', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 32, item_name: 'Pia', description: 'Com água quente e fria', brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 33, item_name: 'Vigia', description: 'No cockpit', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'conves_principal', display_order: 34, item_name: 'Porta de acesso', description: 'De fibra de vidro e vidro temperado', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== SALÃO (9 itens) =====
      { category: 'salao', display_order: 1, item_name: 'Sofá em L', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'salao', display_order: 2, item_name: 'Mesa de centro dobrável', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'salao', display_order: 3, item_name: 'Bar tipo armário', description: 'Com resfriador de gaveta e espaço para garrafas', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'salao', display_order: 4, item_name: 'Iluminação de cortesia de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'salao', display_order: 5, item_name: 'Piso vinílico', description: 'Imitação madeira', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'salao', display_order: 6, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'salao', display_order: 7, item_name: 'Painel de controle de ar condicionado', description: 'Sistema de teto', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'salao', display_order: 8, item_name: 'Porta de vidro', description: 'Acesso para cockpit em vidro fumê temperado', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'salao', display_order: 9, item_name: 'Ventiladores', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== GALLEY / COZINHA (11 itens) =====
      { category: 'cozinha', display_order: 1, item_name: 'Fogão elétrico', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 2, item_name: 'Forno micro-ondas', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 3, item_name: 'Exaustor', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 4, item_name: 'Pia', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 5, item_name: 'Torneira', description: 'Monocomando com água quente e fria', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 6, item_name: 'Geladeira', description: null, brand: null, model: '180 litros', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 7, item_name: 'Freezer', description: null, brand: null, model: '90 litros', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 8, item_name: 'Armário superior', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 9, item_name: 'Armário inferior', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 10, item_name: 'Iluminação de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'cozinha', display_order: 11, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== COMANDO PRINCIPAL (16 itens) =====
      { category: 'comando_principal', display_order: 1, item_name: 'Cadeira do piloto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 2, item_name: 'Cadeira do co-piloto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 3, item_name: 'Volante', description: 'Em aço inox', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 4, item_name: 'Controle de propulsão', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 5, item_name: 'Painel de instrumentos', description: 'Com mostradores e indicadores', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 6, item_name: 'GPS/chartplotter', description: null, brand: null, model: '12"', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 7, item_name: 'Rádio VHF', description: 'Fixo com DSC', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 8, item_name: 'Rádio VHF', description: 'Portátil', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 9, item_name: 'Piloto automático', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 10, item_name: 'Bússola', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 11, item_name: 'Sistema de som', description: 'Amplificador com controle remoto', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 12, item_name: 'Alto-falantes', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 13, item_name: 'Sonda', description: 'Medidor de profundidade', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 14, item_name: 'Controle dos bow thrusters', description: 'Joystick', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 15, item_name: 'Controle de guinchos de âncora', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'comando_principal', display_order: 16, item_name: 'Antena GPS', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== FLYBRIDGE (28 itens) =====
      { category: 'flybridge', display_order: 1, item_name: 'Cadeira do piloto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 2, item_name: 'Cadeira do co-piloto', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 3, item_name: 'Sofá em L', description: 'Com almofadas e colchões', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 4, item_name: 'Mesa', description: 'Em fibra de vidro com tampo de madeira', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 5, item_name: 'Volante', description: 'Em aço inox', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 6, item_name: 'Controle de propulsão', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 7, item_name: 'Painel de instrumentos', description: 'Com mostradores e indicadores', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 8, item_name: 'GPS/chartplotter', description: null, brand: null, model: '12"', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 9, item_name: 'Controle dos bow thrusters', description: 'Joystick', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 10, item_name: 'Controle de guinchos de âncora', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 11, item_name: 'Controle do guindaste', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 12, item_name: 'Pia com torneira', description: 'Água fria', brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 13, item_name: 'Icemaker', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 14, item_name: 'Churrasqueira elétrica', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 15, item_name: 'Resfriador de gaveta', description: null, brand: null, model: '72 litros', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 16, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 17, item_name: 'Piso em fibra com antiderrapante', description: null, brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 18, item_name: 'Guarda-corpo', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 19, item_name: 'Porta-copos', description: null, brand: 'Aço inox', model: null, quantity: 4, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 20, item_name: 'Painel de controle de iluminação', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 21, item_name: 'Luzes de cortesia', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 22, item_name: 'Alto-falantes à prova d\'água', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 23, item_name: 'Holofote de busca', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 24, item_name: 'Hard top em fibra de vidro', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 25, item_name: 'Antena de rádio', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 26, item_name: 'Suporte de vara de pesca', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 27, item_name: 'Cunhos', description: null, brand: 'Aço inox', model: null, quantity: 4, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'flybridge', display_order: 28, item_name: 'Escada de acesso', description: 'Do deck principal', brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== CORREDOR INFERIOR (4 itens) =====
      { category: 'lobby_conves_inferior', display_order: 1, item_name: 'Iluminação de cortesia no teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'lobby_conves_inferior', display_order: 2, item_name: 'Piso vinílico', description: 'Imitação madeira', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'lobby_conves_inferior', display_order: 3, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'lobby_conves_inferior', display_order: 4, item_name: 'Vigia', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== CABINE MASTER (13 itens) =====
      { category: 'cabine_master', display_order: 1, item_name: 'Cama de casal', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 2, item_name: 'Criados mudos', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 3, item_name: 'Armário tipo closet', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 4, item_name: 'Escrivaninha', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 5, item_name: 'Cadeira', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 6, item_name: 'Espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 7, item_name: 'Iluminação de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 8, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 9, item_name: 'Painel de controle de ar condicionado', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 10, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 11, item_name: 'Piso vinílico', description: 'Imitação madeira', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 12, item_name: 'Vigia', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_master', display_order: 13, item_name: 'Ventilador', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== WC MASTER (9 itens) =====
      { category: 'banheiro_master', display_order: 1, item_name: 'Vaso sanitário', description: 'Elétrico', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_master', display_order: 2, item_name: 'Pia', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_master', display_order: 3, item_name: 'Torneira', description: 'Monocomando com água quente e fria', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_master', display_order: 4, item_name: 'Chuveiro', description: 'Box de vidro com água quente e fria', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_master', display_order: 5, item_name: 'Armário com espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_master', display_order: 6, item_name: 'Exaustor', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_master', display_order: 7, item_name: 'Iluminação de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'banheiro_master', display_order: 8, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_master', display_order: 9, item_name: 'Vigia', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== CABINE VIP (13 itens) =====
      { category: 'cabine_vip', display_order: 1, item_name: 'Cama de casal', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 2, item_name: 'Criados mudos', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 3, item_name: 'Armário tipo closet', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 4, item_name: 'Escrivaninha', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 5, item_name: 'Cadeira', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 6, item_name: 'Espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 7, item_name: 'Iluminação de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 8, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 9, item_name: 'Painel de controle de ar condicionado', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 10, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 11, item_name: 'Piso vinílico', description: 'Imitação madeira', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 12, item_name: 'Vigia', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_vip', display_order: 13, item_name: 'Ventilador', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== WC VIP (9 itens) =====
      { category: 'banheiro_vip', display_order: 1, item_name: 'Vaso sanitário', description: 'Elétrico', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_vip', display_order: 2, item_name: 'Pia', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_vip', display_order: 3, item_name: 'Torneira', description: 'Monocomando com água quente e fria', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_vip', display_order: 4, item_name: 'Chuveiro', description: 'Box de vidro com água quente e fria', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_vip', display_order: 5, item_name: 'Armário com espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_vip', display_order: 6, item_name: 'Exaustor', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_vip', display_order: 7, item_name: 'Iluminação de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'banheiro_vip', display_order: 8, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_vip', display_order: 9, item_name: 'Vigia', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== CABINE HÓSPEDES (12 itens) =====
      { category: 'cabine_hospedes', display_order: 1, item_name: 'Camas de solteiro', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 2, item_name: 'Criados mudos', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 3, item_name: 'Armário', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 4, item_name: 'Escrivaninha', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 5, item_name: 'Cadeira', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 6, item_name: 'Espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 7, item_name: 'Iluminação de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 8, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 9, item_name: 'Painel de controle de ar condicionado', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 10, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 11, item_name: 'Piso vinílico', description: 'Imitação madeira', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'cabine_hospedes', display_order: 12, item_name: 'Vigia', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== WC HÓSPEDES (9 itens) =====
      { category: 'banheiro_hospedes', display_order: 1, item_name: 'Vaso sanitário', description: 'Elétrico', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_hospedes', display_order: 2, item_name: 'Pia', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_hospedes', display_order: 3, item_name: 'Torneira', description: 'Monocomando com água quente e fria', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_hospedes', display_order: 4, item_name: 'Chuveiro', description: 'Box de vidro com água quente e fria', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_hospedes', display_order: 5, item_name: 'Armário com espelho', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_hospedes', display_order: 6, item_name: 'Exaustor', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_hospedes', display_order: 7, item_name: 'Iluminação de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'banheiro_hospedes', display_order: 8, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'banheiro_hospedes', display_order: 9, item_name: 'Vigia', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== CABINE TRIPULAÇÃO (7 itens) =====
      { category: 'cabine_tripulacao', display_order: 1, item_name: 'Beliche', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_tripulacao', display_order: 2, item_name: 'Armário', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_tripulacao', display_order: 3, item_name: 'Iluminação de teto', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'cabine_tripulacao', display_order: 4, item_name: 'Luminárias de leitura', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_tripulacao', display_order: 5, item_name: 'Tomadas 110V e 220V', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'cabine_tripulacao', display_order: 6, item_name: 'Piso vinílico', description: 'Imitação madeira', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'cabine_tripulacao', display_order: 7, item_name: 'Painel de controle de ar condicionado', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== CASA DE MÁQUINAS (15 itens) =====
      { category: 'sala_maquinas', display_order: 1, item_name: 'Motores', description: 'Diesel Cummins', brand: null, model: '600HP', quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 2, item_name: 'Eixos', description: 'Em aço inox', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 3, item_name: 'Hélices em alumínio naval', description: 'De 5 pás', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 4, item_name: 'Lemes', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 5, item_name: 'Tanques de óleo diesel', description: null, brand: null, model: '2500 litros', quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 6, item_name: 'Separadores de água/combustível', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 7, item_name: 'Deck fill diesel', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 8, item_name: 'Tanque de água doce', description: null, brand: null, model: '1250 litros', quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 9, item_name: 'Deck fill de água', description: null, brand: 'Aço inox', model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 10, item_name: 'Filtros Racor para motores', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 11, item_name: 'Sistema de exaustão', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 12, item_name: 'Sistema de ventilação', description: 'Forçado', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 13, item_name: 'Isolamento acústico', description: null, brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 14, item_name: 'Aquecedor de água elétrico', description: null, brand: null, model: '30 litros, 230V', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sala_maquinas', display_order: 15, item_name: 'Iluminação de emergência', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },

      // ===== PROPULSÃO E CONTROLE (7 itens) =====
      { category: 'propulsao_controle', display_order: 1, item_name: 'Sistema de direção hidráulica', description: null, brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'propulsao_controle', display_order: 2, item_name: 'Bow thruster', description: 'Hidráulico', brand: null, model: '20HP', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'propulsao_controle', display_order: 3, item_name: 'Trim tabs', description: 'Com controle no comando principal e flybridge', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'propulsao_controle', display_order: 4, item_name: 'Estabilizadores hidráulicos', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'propulsao_controle', display_order: 5, item_name: 'Sistema de combustível', description: 'Com filtros e bombas', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'propulsao_controle', display_order: 6, item_name: 'Sistema de resfriamento', description: 'Com trocadores de calor', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'propulsao_controle', display_order: 7, item_name: 'Sistema de lubrificação', description: null, brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },

      // ===== SISTEMA ELÉTRICO (21 itens) =====
      { category: 'eletrica', display_order: 1, item_name: 'Painel elétrico principal', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 2, item_name: 'Painel elétrico secundário', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 3, item_name: 'Quadro de distribuição AC', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 4, item_name: 'Quadro de distribuição DC', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 5, item_name: 'Transformador isolador', description: null, brand: null, model: '230V/110V, 8kVA', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 6, item_name: 'Conexão de energia de cais', description: null, brand: null, model: '230V/50Hz, 63A', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 7, item_name: 'Sistema de monitoração de tanques', description: 'Com painel de controle', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 8, item_name: 'Sistema de alarme de nível de água de porão', description: null, brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 9, item_name: 'Conversor de voltagem', description: null, brand: null, model: '24VDC para 12VDC', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 10, item_name: 'Gerador', description: 'Diesel', brand: null, model: '21.5kW', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 11, item_name: 'Cabo de conexão de cais', description: null, brand: null, model: '230V, 15 metros', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 12, item_name: 'Carregador de bateria', description: null, brand: null, model: '24V, 100A', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 13, item_name: 'Inversor de corrente', description: null, brand: null, model: '24VDC/230VAC, 2500W', quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 14, item_name: 'Banco de bateria de serviço', description: null, brand: null, model: '24V, baixa perda de água', quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 15, item_name: 'Banco de bateria de partida', description: null, brand: null, model: '24V', quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 16, item_name: 'Sistema de iluminação LED', description: 'Em 24V, exceto casa de máquinas', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 17, item_name: 'Luzes de navegação', description: 'Conforme RIPEAM', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 18, item_name: 'Luzes subaquáticas', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 19, item_name: 'Chave geral das baterias', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 20, item_name: 'Cabos elétricos marinizados', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },
      { category: 'eletrica', display_order: 21, item_name: 'Disjuntores e fusíveis', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },

      // ===== SISTEMA DE EXTINÇÃO DE INCÊNDIO (4 itens) =====
      { category: 'seguranca', display_order: 1, item_name: 'Sistema automático de extinção de incêndio', description: 'Na praça de máquinas', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'seguranca', display_order: 2, item_name: 'Extintores de incêndio', description: null, brand: null, model: null, quantity: 4, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'seguranca', display_order: 3, item_name: 'Alarme de incêndio', description: null, brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'seguranca', display_order: 4, item_name: 'Detectores de fumaça', description: null, brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: true, is_active: true },

      // ===== EQUIPAMENTOS ELETRÔNICOS (5 itens) =====
      { category: 'equipamentos_eletronicos', display_order: 1, item_name: 'Antena de rádio VHF', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'equipamentos_eletronicos', display_order: 2, item_name: 'Sistema de interfone', description: 'Entre comando e praça de máquinas', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'equipamentos_eletronicos', display_order: 3, item_name: 'Transdutor de profundidade', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'equipamentos_eletronicos', display_order: 4, item_name: 'Transdutor de velocidade', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'equipamentos_eletronicos', display_order: 5, item_name: 'Sensor de vento', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },

      // ===== SISTEMA DE ÁGUA DE PORÃO (3 itens) =====
      { category: 'sistema_bombas_porao', display_order: 1, item_name: 'Bombas de água de porão', description: 'Automáticas', brand: null, model: null, quantity: 3, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_bombas_porao', display_order: 2, item_name: 'Bomba de água de porão', description: 'Manual', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_bombas_porao', display_order: 3, item_name: 'Alarme de nível de água de porão', description: null, brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },

      // ===== SISTEMA SANITÁRIO (13 itens) =====
      { category: 'sistema_agua_sanitario', display_order: 1, item_name: 'Tanques de águas cinzas', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 2, item_name: 'Tanques de águas negras', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 3, item_name: 'Bombas de transferência de águas cinzas', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 4, item_name: 'Bombas de transferência de águas negras', description: null, brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 5, item_name: 'Deck fill de água cinza', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 6, item_name: 'Deck fill de água negra', description: null, brand: 'Aço inox', model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 7, item_name: 'Sistema de distribuição de água doce', description: 'Com bomba pressurizada', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 8, item_name: 'Sistema de água quente', description: 'Circulação em anel', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 9, item_name: 'Filtro de água', description: 'Para água potável', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 10, item_name: 'Sistema de descarga elétrica', description: 'Para vasos sanitários', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 11, item_name: 'Válvula de limpeza de tanques', description: null, brand: null, model: null, quantity: 4, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 12, item_name: 'Mangueira de esgotamento', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: true, is_active: true },
      { category: 'sistema_agua_sanitario', display_order: 13, item_name: 'Sistema de exaustão de banheiros', description: null, brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },

      // ===== SISTEMA DE AR CONDICIONADO (1 item) =====
      { category: 'sistema_ar_condicionado', display_order: 1, item_name: 'Sistema de ar condicionado tipo self-contained', description: 'Para todas as cabines e salão, 110.000 BTU', brand: null, model: null, quantity: 1, unit: 'sistema', is_customizable: true, is_active: true },

      // ===== OPCIONAIS SUGERIDOS (29 itens) =====
      { category: 'comando_principal', display_order: 100, item_name: '[OPCIONAL] 3º comando no flybridge', description: 'Comando adicional completo', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'eletrica', display_order: 100, item_name: '[OPCIONAL] 07 luzes submersas RGB', description: 'Iluminação subaquática colorida', brand: null, model: null, quantity: 7, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'equipamentos_eletronicos', display_order: 100, item_name: '[OPCIONAL] Upgrade telas Simrad', description: 'Telas maiores de navegação', brand: 'Simrad', model: null, quantity: 1, unit: 'upgrade', is_customizable: false, is_active: true },
      { category: 'flybridge', display_order: 100, item_name: '[OPCIONAL] Bimini top no flybridge', description: 'Cobertura retrátil', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'conves_principal', display_order: 100, item_name: '[OPCIONAL] Plataforma submergível com guindaste de proa', description: 'Para embarque e desembarque facilitado', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'acabamentos', display_order: 1, item_name: '[OPCIONAL] Piso vinílico imitação madeira Amtico', description: 'Upgrade de piso premium', brand: 'Amtico', model: null, quantity: 1, unit: 'm²', is_customizable: false, is_active: true },
      { category: 'propulsao_controle', display_order: 100, item_name: '[OPCIONAL] Estabilizador de cruzeiro Seekeeper', description: 'Sistema giroscópico de estabilização', brand: 'Seekeeper', model: '6', quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'conves_principal', display_order: 101, item_name: '[OPCIONAL] Passarela telescópica de fibra de carbono', description: 'Com controle remoto', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'cozinha', display_order: 100, item_name: '[OPCIONAL] Espaço Gourmet no flybridge', description: 'Com churrasqueira de embutir e pia', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: false, is_active: true },
      { category: 'audiovisual_entretenimento', display_order: 1, item_name: '[OPCIONAL] TV LED 43" com lift elétrico no salão', description: null, brand: null, model: '43"', quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'audiovisual_entretenimento', display_order: 2, item_name: '[OPCIONAL] TV LED 32" na cabine master', description: null, brand: null, model: '32"', quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'audiovisual_entretenimento', display_order: 3, item_name: '[OPCIONAL] TV LED 32" na cabine VIP', description: null, brand: null, model: '32"', quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'audiovisual_entretenimento', display_order: 4, item_name: '[OPCIONAL] TV LED 32" na cabine hóspedes', description: null, brand: null, model: '32"', quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'acabamentos', display_order: 2, item_name: '[OPCIONAL] Revestimento Calacata no WC master', description: 'Mármore premium', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: false, is_active: true },
      { category: 'acabamentos', display_order: 3, item_name: '[OPCIONAL] Revestimento Calacata no WC VIP', description: 'Mármore premium', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: false, is_active: true },
      { category: 'acabamentos', display_order: 4, item_name: '[OPCIONAL] Revestimento Calacata no WC hóspedes', description: 'Mármore premium', brand: null, model: null, quantity: 1, unit: 'm²', is_customizable: false, is_active: true },
      { category: 'flybridge', display_order: 101, item_name: '[OPCIONAL] Mesa de fibra no flybridge', description: 'Substituindo mesa com tampo de madeira', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'eletrica', display_order: 101, item_name: '[OPCIONAL] 02 luminárias pop-up na proa', description: 'Iluminação retrátil', brand: null, model: null, quantity: 2, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'conves_principal', display_order: 102, item_name: '[OPCIONAL] 04 cadeiras dobráveis com suporte no cockpit', description: null, brand: null, model: null, quantity: 4, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'acabamentos', display_order: 5, item_name: '[OPCIONAL] Pintura de fundo anti-fouling', description: 'Proteção contra incrustações', brand: null, model: null, quantity: 1, unit: 'aplicação', is_customizable: false, is_active: true },
      { category: 'conves_principal', display_order: 103, item_name: '[OPCIONAL] Porta-copos de teca', description: 'Para sofá de popa', brand: null, model: null, quantity: 4, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'flybridge', display_order: 102, item_name: '[OPCIONAL] Geleira no flybridge', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'equipamentos_eletronicos', display_order: 101, item_name: '[OPCIONAL] Antena internet 3G/4G', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'audiovisual_entretenimento', display_order: 5, item_name: '[OPCIONAL] Antena TV via satélite', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'flybridge', display_order: 103, item_name: '[OPCIONAL] Domo vazio para radar', description: 'Preparação para instalação futura', brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'conves_principal', display_order: 104, item_name: '[OPCIONAL] Fechamento de popa em lona', description: 'Com estrutura', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: false, is_active: true },
      { category: 'flybridge', display_order: 104, item_name: '[OPCIONAL] Fechamento de flybridge em lona', description: 'Com estrutura', brand: null, model: null, quantity: 1, unit: 'conjunto', is_customizable: false, is_active: true },
      { category: 'cabine_tripulacao', display_order: 100, item_name: '[OPCIONAL] Máquina lava e seca de roupas', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
      { category: 'cabine_tripulacao', display_order: 101, item_name: '[OPCIONAL] Freezer extra', description: null, brand: null, model: null, quantity: 1, unit: 'unidade', is_customizable: false, is_active: true },
    ];

    console.log(`Inserting ${memorialItems.length} memorial items...`);

    const { data: insertedItems, error: insertError } = await supabase
      .from('memorial_items')
      .insert(
        memorialItems.map(item => ({
          ...item,
          yacht_model_id: yachtModelId,
        }))
      )
      .select();

    if (insertError) {
      console.error('Error inserting items:', insertError);
      throw new Error(`Failed to insert memorial items: ${insertError.message}`);
    }

    console.log(`Successfully inserted ${insertedItems?.length || 0} memorial items`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `FY550 memorial populated with ${insertedItems?.length || 0} items`,
        itemsCreated: insertedItems?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-fy550-memorial function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
