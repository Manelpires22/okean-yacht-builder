import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category normalization mapping
const CATEGORY_NORMALIZATION: Record<string, string> = {
  'DECK PRINCIPAL': 'Deck Principal',
  'SALÃO': 'Salão',
  'GALLEY': 'Galley',
  'COMANDO PRINCIPAL': 'Comando Principal',
  'Comando principal': 'Comando Principal',
  'FLYBRIDGE': 'Flybridge',
  'Corredor': 'Corredor',
  'CABINE MASTER': 'Cabine Master',
  'WC CABINE MASTER': 'WC Cabine Master',
  'CABINE VIP': 'Cabine VIP',
  'WC VIP': 'WC VIP',
  'CABINE HÓSPEDES': 'Cabine Hóspedes',
  'WC HÓSPEDES': 'WC Hóspedes',
  'Área de armazenamento de popa': 'Área de Armazenamento de Popa',
  'Cabine de marinheiro com banheiro': 'Cabine de Marinheiro',
  'Casa de máquinas': 'Casa de Máquinas',
  'Propulsão e Controle': 'Propulsão e Controle',
  'Comunicação': 'Comunicação',
  'Navegação': 'Navegação',
  'Sistema de Extinção de Incêndio': 'Sistema de Extinção de Incêndio',
  'Sistema Elétrico': 'Sistema Elétrico',
  'Sistema de água de porão': 'Sistema de Água de Porão',
  'Sistemas sanitário e de água doce': 'Sistema Sanitário e de Água Doce',
  'Sistema de ar-condicionado': 'Sistema de Ar-condicionado',
  'Sistema de ar condicionado': 'Sistema de Ar-condicionado',
  'POPA Área de armazenamento de popa': 'Área de Armazenamento de Popa',
  'ÁREA TECNICA Casa de máquinas': 'Casa de Máquinas',
  'Equipamentos Elétrico Comunicação': 'Comunicação',
  'SISTEMAS Sistema de Extinção de Incêndio': 'Sistema de Extinção de Incêndio',
};

function normalizeCategory(category: string): string {
  return CATEGORY_NORMALIZATION[category] || category;
}

function parseCSV(text: string): Array<{ model: string; category: string; description: string }> {
  const lines = text.split('\n');
  const items: Array<{ model: string; category: string; description: string }> = [];
  
  // Skip header lines (first 3 lines)
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === ';') continue;
    
    // Parse CSV considering quoted fields
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // Escaped quote
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      parts.push(current.trim());
    }
    
    if (parts.length >= 3) {
      const model = parts[0].trim();
      const category = parts[1].trim();
      const description = parts[2].trim().replace(/;$/, '');
      
      if (model && category && description) {
        items.push({
          model,
          category: normalizeCategory(category),
          description
        });
      }
    }
  }
  
  return items;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting Memorial Okean import...');

    // Read CSV file
    const csvPath = new URL('./boat_items.csv', import.meta.url).pathname;
    const csvContent = await Deno.readTextFile(csvPath);
    
    console.log('CSV file loaded, parsing...');
    const items = parseCSV(csvContent);
    console.log(`Parsed ${items.length} items from CSV`);

    // Clear existing data
    const { error: deleteError } = await supabase
      .from('memorial_okean')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
      throw deleteError;
    }

    console.log('Existing data cleared, inserting new items...');

    // Insert items in batches
    const batchSize = 100;
    let inserted = 0;
    const insertErrors: string[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize).map(item => {
        // Normalize model names: FY550 → FY 550
        const normalizedModel = item.model.replace(/^(FY)(\d+)$/, '$1 $2');
        
        return {
          modelo: normalizedModel,
          categoria: item.category,
          descricao_item: item.description,
          tipo_item: 'Padrão',
          quantidade: 1,
          is_customizable: true,
          marca: null
        };
      });

      const { error: insertError } = await supabase
        .from('memorial_okean')
        .insert(batch);

      if (insertError) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, insertError);
        insertErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
        continue; // Tenta próximo batch
      }

      inserted += batch.length;
      console.log(`Inserted ${inserted}/${items.length} items`);
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('memorial_okean')
      .select('modelo, categoria')
      .order('modelo')
      .order('categoria');

    const modelCount: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};

    stats?.forEach(item => {
      modelCount[item.modelo] = (modelCount[item.modelo] || 0) + 1;
      categoryCount[item.categoria] = (categoryCount[item.categoria] || 0) + 1;
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${inserted} items`,
        statistics: {
          total: inserted,
          byModel: modelCount,
          byCategory: categoryCount,
          uniqueCategories: Object.keys(categoryCount).length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
