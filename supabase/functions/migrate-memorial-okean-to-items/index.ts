import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento inteligente de categorias string → enum
const CATEGORY_MAPPING: Record<string, string> = {
  // Convés Principal
  'CONVÉS PRINCIPAL': 'conves_principal',
  'Convés Principal': 'conves_principal',
  'Deck Principal': 'conves_principal',
  'Plataforma Principal': 'conves_principal',
  'Cockpit e Praça de Popa': 'conves_principal',
  'Praça de Popa/Cockpit': 'conves_principal',
  'Proa': 'conves_principal',
  'Área Gourmet de Popa': 'conves_principal',
  'Área de Armazenamento de Popa': 'conves_principal',
  'Casco e Convés': 'conves_principal',
  'Características Externas': 'conves_principal',
  
  // Salão
  'Salão': 'salao',
  'Salao': 'salao',
  
  // Flybridge
  'FLYBRIDGE': 'flybridge',
  'Flybridge': 'flybridge',
  
  // Comandos
  'Comando Principal': 'comando_principal',
  'Posição de Comando do Flybridge': 'comando_principal',
  'Comando do Flybridge': 'comando_principal',
  'Comando Flybridge': 'comando_principal',
  
  // Cozinha
  'Área da Cozinha': 'area_cozinha',
  'Cozinha': 'cozinha_galley',
  'Cozinha/ Galley': 'cozinha_galley',
  'Galley': 'cozinha_galley',
  'Cozinha do Deck Principal': 'cozinha_galley',
  'Cozinha do Salão': 'cozinha_galley',
  
  // Área de Jantar
  'Área de Jantar': 'area_jantar',
  
  // Lavabo
  'Lavabo': 'lavabo',
  
  // Cabines
  'Cabine Master': 'cabine_master',
  'Cabine Master (Full Beam)': 'cabine_master',
  'Cabine Master de Proa': 'cabine_master',
  'Cabine Principal': 'cabine_master',
  
  'Cabine VIP': 'cabine_vip',
  'Cabine VIP (Proa)': 'cabine_vip_proa',
  'Cabine VIP de Proa': 'cabine_vip_proa',
  'Cabine VIP na Proa': 'cabine_vip_proa',
  
  'Cabine Hóspedes Bombordo': 'cabine_hospedes_bombordo',
  'Cabine de Hóspedes': 'cabine_hospedes_bombordo',
  'Cabine Hóspedes': 'cabine_hospedes_bombordo',
  'Cabine Hóspedes a Bombordo': 'cabine_hospedes_bombordo',
  
  'Cabine Hóspedes Boreste': 'cabine_hospedes_boreste',
  'Cabine Hóspedes a Estibordo': 'cabine_hospedes_boreste',
  
  'Cabine Capitão': 'cabine_capitao',
  'Cabine do Capitão': 'cabine_capitao',
  
  'Cabine Tripulação': 'cabine_tripulacao',
  'Cabine da Tripulação': 'cabine_tripulacao',
  'Cabine da tripulação a estibordo': 'cabine_tripulacao',
  'Cabine de Marinheiro': 'cabine_tripulacao',
  
  // Banheiros
  'Banheiro Master': 'banheiro_master',
  'Banheiro Cabine Master': 'banheiro_master',
  'Banheiro da Cabine Master': 'banheiro_master',
  'WC Cabine Master': 'banheiro_master',
  'WC Master': 'banheiro_master',
  
  'Banheiro VIP': 'banheiro_vip',
  'Banheiro da Cabine VIP': 'banheiro_vip',
  'WC VIP': 'banheiro_vip',
  
  'Banheiro Hóspedes Bombordo': 'banheiro_hospedes_bombordo',
  'Banheiro de Hóspedes': 'banheiro_hospedes_bombordo',
  'Banheiro Cabine Hóspedes': 'banheiro_hospedes_bombordo',
  'WC Hóspedes': 'banheiro_hospedes_bombordo',
  
  'Banheiro Hóspedes Boreste': 'banheiro_hospedes_boreste',
  
  'Banheiro Capitão': 'banheiro_capitao',
  'Banheiro do Capitão': 'banheiro_capitao',
  
  'Banheiro Tripulação': 'banheiro_tripulacao',
  'Banheiro da Tripulação': 'banheiro_tripulacao',
  
  // Lobbies
  'Lobby': 'lobby_conves_inferior',
  'Lower Deck Lobby': 'lobby_conves_inferior',
  'Hall/Corredor': 'lobby_conves_inferior',
  'Corredor': 'lobby_conves_inferior',
  
  'Lobby Tripulação': 'lobby_tripulacao',
  'Lobby da Área da Tripulação': 'lobby_tripulacao',
  'Lobby na área da tripulação': 'lobby_tripulacao',
  'Dinette Tripulação': 'lobby_tripulacao',
  'Corredor na Área da Tripulação': 'lobby_tripulacao',
  
  // Sistemas técnicos
  'Sala de Máquinas': 'sala_maquinas',
  'Casa de Máquinas': 'sala_maquinas',
  'Área Técnica / Sala de Máquinas': 'sala_maquinas',
  
  'Garagem': 'garagem',
  
  'Propulsão e Controle': 'propulsao_controle',
  'Propulsão e controle': 'propulsao_controle',
  'Equipamento de Propulsão e Controle': 'propulsao_controle',
  'Motorização': 'propulsao_controle',
  'Propulsão e Navegação': 'propulsao_controle',
  
  'Sistema Estabilização': 'sistema_estabilizacao',
  'Sistemas de Estabilização': 'sistema_estabilizacao',
  
  'Equipamentos Eletrônicos': 'equipamentos_eletronicos',
  'Kit de Eletrônicos e Equipamentos': 'equipamentos_eletronicos',
  'Navegação': 'equipamentos_eletronicos',
  'Comunicação': 'equipamentos_eletronicos',
  'Sistema de Monitoramento': 'equipamentos_eletronicos',
  'Sistema monitoramento': 'equipamentos_eletronicos',
  
  'Sistema de Extinção de Incêndio': 'sistema_extincao_incendio',
  'Sistema de extinção de incêndio': 'sistema_extincao_incendio',
  'Sistema de Extinção de Incêndio FM200': 'sistema_extincao_incendio',
  'Sistema de Extinção de Incêndios': 'sistema_extincao_incendio',
  
  'Sistema Ar-Condicionado': 'sistema_ar_condicionado',
  'Sistema de Ar Condicionado': 'sistema_ar_condicionado',
  'Sistema de Ar-condicionado': 'sistema_ar_condicionado',
  'Sistema ar-condicionado': 'sistema_ar_condicionado',
  'Ar-condicionado': 'sistema_ar_condicionado',
  
  'Sistema de Bombas de Porão': 'sistema_bombas_porao',
  'Sistema de bombas de porão': 'sistema_bombas_porao',
  'Sistema de Água de Porão': 'sistema_bombas_porao',
  'Sistema de Porão': 'sistema_bombas_porao',
  
  'Sistema de Água e Sanitário': 'sistema_agua_sanitario',
  'Sistema de água doce e sanitário': 'sistema_agua_sanitario',
  'Sistema Sanitário e de Água Doce': 'sistema_agua_sanitario',
  'Sistemas Sanitários e de Água': 'sistema_agua_sanitario',
  
  'Sistema Elétrico': 'eletrica',
  
  'Segurança e Salvatagem': 'seguranca',
  
  'Audiovisual e Entretenimento': 'audiovisual_entretenimento',
  'Conforto e Entretenimento': 'audiovisual_entretenimento',
  'Pacote de Som - Fusion': 'audiovisual_entretenimento',
  
  // Outros/genéricos
  'Diversos': 'outros',
  'Opcionais Inclusos': 'outros',
  'Para Todos os Layouts': 'outros',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Iniciando migração de memorial_okean → memorial_items');

    // 1. Buscar modelos ativos
    const { data: yachtModels, error: modelsError } = await supabase
      .from('yacht_models')
      .select('id, code, name')
      .eq('is_active', true)
      .order('name');

    if (modelsError) throw modelsError;
    console.log(`✅ ${yachtModels.length} modelos ativos encontrados`);

    let totalMigrated = 0;
    let totalSkipped = 0;
    const unmappedCategories = new Set<string>();
    const modelDetails: any[] = [];

    // 2. Para cada modelo, processar itens
    for (const model of yachtModels) {
      console.log(`\n📦 Processando modelo: ${model.name} (${model.code})`);

      // Normalizar código do modelo para buscar no memorial_okean
      // FY850 → FY 850, FY550 → FY 550
      const normalizedCode = model.code.replace(/([A-Z]+)(\d+)/, '$1 $2');
      
      // Buscar itens do memorial_okean para este modelo
      const { data: okeanItems, error: okeanError } = await supabase
        .from('memorial_okean')
        .select('*')
        .or(`modelo.eq.${model.code},modelo.eq.${normalizedCode}`)
        .order('categoria')
        .order('id');

      if (okeanError) {
        console.error(`❌ Erro ao buscar itens para ${model.name}:`, okeanError);
        continue;
      }

      console.log(`  📋 ${okeanItems.length} itens encontrados no memorial_okean`);

      let itemsCreated = 0;
      let itemsSkipped = 0;

      // Agrupar por categoria para gerar display_order
      const itemsByCategory: Record<string, any[]> = {};
      
      for (const item of okeanItems) {
        const mappedCategory = CATEGORY_MAPPING[item.categoria];
        
        if (!mappedCategory) {
          unmappedCategories.add(item.categoria);
          console.warn(`  ⚠️  Categoria não mapeada: "${item.categoria}"`);
          itemsSkipped++;
          continue;
        }

        if (!itemsByCategory[mappedCategory]) {
          itemsByCategory[mappedCategory] = [];
        }
        
        itemsByCategory[mappedCategory].push(item);
      }

      // 3. Inserir itens no memorial_items
      for (const [category, items] of Object.entries(itemsByCategory)) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          // Verificar se item já existe (evitar duplicatas)
          const { data: existing } = await supabase
            .from('memorial_items')
            .select('id')
            .eq('yacht_model_id', model.id)
            .eq('item_name', item.descricao_item)
            .eq('category', category)
            .maybeSingle();

          if (existing) {
            itemsSkipped++;
            continue;
          }

          // Inserir novo item
          const { error: insertError } = await supabase
            .from('memorial_items')
            .insert({
              yacht_model_id: model.id,
              category: category,
              item_name: item.descricao_item,
              description: item.descricao_item,
              brand: item.marca,
              model: item.modelo,
              quantity: item.quantidade || 1,
              unit: 'unidade',
              display_order: i + 1,
              is_customizable: item.is_customizable !== false,
              is_active: true,
            });

          if (insertError) {
            console.error(`  ❌ Erro ao inserir item "${item.descricao_item}":`, insertError);
            itemsSkipped++;
          } else {
            itemsCreated++;
          }
        }
      }

      totalMigrated += itemsCreated;
      totalSkipped += itemsSkipped;

      modelDetails.push({
        model: model.name,
        items_created: itemsCreated,
        items_skipped: itemsSkipped,
      });

      console.log(`  ✅ ${itemsCreated} itens criados, ${itemsSkipped} pulados`);
    }

    // 4. Retornar relatório
    const report = {
      success: true,
      models_processed: yachtModels.length,
      items_migrated: totalMigrated,
      items_skipped: totalSkipped,
      unmapped_categories: Array.from(unmappedCategories).sort(),
      details: modelDetails,
    };

    console.log('\n🎉 Migração concluída!');
    console.log(`📊 Total: ${totalMigrated} itens migrados, ${totalSkipped} pulados`);
    if (unmappedCategories.size > 0) {
      console.log(`⚠️  ${unmappedCategories.size} categorias não mapeadas`);
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
